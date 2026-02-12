import {
  Injectable,
  NotFoundException,
  Inject,
  Optional,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { DataSource, QueryRunner, Repository } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import axios from "axios";
import { BasePayinService } from "./base-payin.service";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { WalletEntity } from "@/entities/wallet.entity";
// import { PayinWalletEntity } from "@/entities/payin-wallet.entity";
import { UsersEntity } from "@/entities/user.entity";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { REDIS_KEYS } from "@/constants/redis-cache.constant";
import { convertExternalPaymentStatusToInternal } from "@/utils/helperFunctions.utils";
import { LoggerPlaceHolder } from "@/logger";
import { CommissionService } from "@/modules/commissions/commission.service";

/**
 * Base service for handling payin webhooks
 * Extends BasePayinService to have access to repositories
 * Contains common logic for processing webhooks across all integrations
 */
@Injectable()
export abstract class BasePayinWebhookService extends BasePayinService {
  constructor(
    @InjectRepository(PayInOrdersEntity)
    payInOrdersRepository: Repository<PayInOrdersEntity>,
    @InjectRepository(TransactionsEntity)
    transactionsRepository: Repository<TransactionsEntity>,
    @InjectRepository(WalletEntity)
    protected readonly walletRepository: Repository<WalletEntity>,
    // @InjectRepository(PayinWalletEntity)
    // protected readonly payinWalletRepository: Repository<PayinWalletEntity>,
    @InjectDataSource()
    dataSource: DataSource,
    @Inject(CACHE_MANAGER) protected readonly cacheManager: Cache,
    @Optional()
    @Inject(forwardRef(() => CommissionService))
    commissionService?: CommissionService,
  ) {
    super(
      payInOrdersRepository,
      transactionsRepository,
      dataSource,
      commissionService,
    );
  }

  /**
   * Find payin order by txnRefId or orderId
   * Override this if your integration uses different fields
   * Optimized with caching to reduce database load
   */
  protected async findPayinOrder(
    txnRefId?: string,
    orderId?: string,
  ): Promise<PayInOrdersEntity | null> {
    // Try cache first to reduce database load
    if (orderId) {
      const cacheKey = `payin_order:orderId:${orderId}`;
      const cached = await this.cacheManager.get<PayInOrdersEntity>(cacheKey);
      if (cached) {
        // Cache hit - still need to fetch with relations for fresh data
        // But cache helps reduce load for duplicate webhook checks
        const order = await this.payInOrdersRepository.findOne({
          where: { orderId },
          relations: ["user"],
        });
        if (order) {
          return order;
        }
      }
    }

    if (txnRefId) {
      const cacheKey = `payin_order:txnRefId:${txnRefId}`;
      const cached = await this.cacheManager.get<PayInOrdersEntity>(cacheKey);
      if (cached) {
        const order = await this.payInOrdersRepository.findOne({
          where: { txnRefId },
          relations: ["user"],
        });
        if (order) {
          return order;
        }
      }
    }

    // Database query - cache result for future lookups
    let order: PayInOrdersEntity | null = null;

    if (txnRefId) {
      order = await this.payInOrdersRepository.findOne({
        where: { txnRefId },
        relations: ["user"],
      });
      if (order) {
        await this.cacheManager.set(
          `payin_order:txnRefId:${txnRefId}`,
          order,
          300,
        ); // 5 min cache

        return order;
      }
    }

    if (orderId) {
      order = await this.payInOrdersRepository.findOne({
        where: { orderId },
        relations: ["user"],
      });
      if (order) {
        await this.cacheManager.set(
          `payin_order:orderId:${orderId}`,
          order,
          300,
        ); // 5 min cache

        return order;
      }
    }

    return null;
  }

  /**
   * Convert external status to internal status
   * Override if your integration needs custom conversion
   */
  protected convertStatus(externalStatus: string): PAYMENT_STATUS {
    return convertExternalPaymentStatusToInternal(externalStatus);
  }

  /**
   * Check for duplicate webhook
   */
  protected isDuplicateWebhook(
    payinOrder: PayInOrdersEntity,
    newStatus: PAYMENT_STATUS,
    isMisspelled?: boolean,
  ): boolean {
    if (payinOrder.status === newStatus) {
      if (
        isMisspelled !== undefined &&
        payinOrder.isMisspelled === isMisspelled
      ) {
        return true;
      }
      if (isMisspelled === undefined) {
        return true;
      }
    }

    return false;
  }

  /**
   * Handle jumping count logic (for testing purposes)
   * Returns modified status and isMisspelled flag
   */
  protected async handleJumpingCount(
    user: UsersEntity,
    status: PAYMENT_STATUS,
  ): Promise<{ status: PAYMENT_STATUS; isMisspelled: boolean }> {
    let isMisspelled = false;
    let finalStatus = status;

    if (status === PAYMENT_STATUS.SUCCESS && user.jumpingCount > 0) {
      let successCount =
        +(await this.cacheManager.get(REDIS_KEYS.SUCCESS_COUNT(user.id))) || 1;

      if (successCount >= user.jumpingCount) {
        const statusArr = [
          PAYMENT_STATUS.PENDING,
          PAYMENT_STATUS.DEEMED,
          PAYMENT_STATUS.INITIATED,
          PAYMENT_STATUS.FAILED,
        ];
        finalStatus = statusArr[Math.floor(Math.random() * statusArr.length)];
        successCount = 0;
        isMisspelled = true;
      } else {
        successCount += 1;
      }

      await this.cacheManager.set(
        REDIS_KEYS.SUCCESS_COUNT(user.id),
        successCount,
        1000 * 60 * 60 * 24 * 20, // 20 days
      );
    }

    return { status: finalStatus, isMisspelled };
  }

  /**
   * Update payin order status
   */
  protected async updatePayinOrderStatus(
    queryRunner: QueryRunner,
    payinOrder: PayInOrdersEntity,
    status: PAYMENT_STATUS,
    updateData: {
      txnRefId?: string;
      utr?: string;
      isMisspelled?: boolean;
      amount?: number;
      commissionAmount?: number;
      gstAmount?: number;
      netPayableAmount?: number;
    },
  ): Promise<void> {
    const updatePayload: any = {
      status,
      ...updateData,
      updatedAt: new Date(),
    };

    if (status === PAYMENT_STATUS.SUCCESS) {
      updatePayload.successAt = new Date();
    } else if (status === PAYMENT_STATUS.FAILED) {
      updatePayload.failureAt = new Date();
    }

    await queryRunner.manager.update(
      PayInOrdersEntity,
      { id: payinOrder.id },
      updatePayload,
    );
  }

  /**
   * Update wallet balance (with locking mechanism)
   */
  protected async safeUpdateWalletBalance(
    queryRunner: QueryRunner,
    userId: string,
    updateFn: (wallet: WalletEntity) => void,
  ): Promise<WalletEntity> {
    const maxRetries = 2; // Reduced from 3 to fail faster and reduce transaction time
    const baseDelay = 25; // Reduced from 50 for faster retries
    const operationTimeout = 2000; // Reduced from 3000 to fail faster
    const lockTimeout = 1000; // Reduced from 2000 to fail faster on lock contention
    const lockTtl = 3000; // Reduced from 5000 to match lockTimeout

    const startTime = Date.now();
    const lockKey = `wallet_update:${userId}`;
    let lockAcquired = false;

    // ✅ OPTIMIZED: Faster lock acquisition with exponential backoff
    const acquireLock = async (): Promise<boolean> => {
      const lockStartTime = Date.now();
      let attempt = 0;
      const maxLockAttempts = 10; // Limit lock acquisition attempts

      while (
        Date.now() - lockStartTime < lockTimeout &&
        attempt < maxLockAttempts
      ) {
        const existingLock = await this.cacheManager.get(lockKey);

        if (!existingLock) {
          // Try to acquire lock using SET with NX (if supported) or double-check pattern
          await this.cacheManager.set(lockKey, "locked", lockTtl);
          // Double-check we got the lock (race condition safety)
          const checkLock = await this.cacheManager.get(lockKey);
          if (checkLock) {
            return true;
          }
        }
        // Exponential backoff for lock acquisition
        const delay = Math.min(10 * Math.pow(1.5, attempt), 100);
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt++;
      }

      return false; // Couldn't acquire lock within timeout
    };

    try {
      // Wait for lock acquisition
      lockAcquired = await acquireLock();

      if (!lockAcquired) {
        throw new Error(
          `Could not acquire wallet lock for user ${userId} within ${lockTimeout}ms`,
        );
      }

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Check if we've exceeded the operation timeout
          if (Date.now() - startTime > operationTimeout) {
            throw new Error(
              `Wallet update timeout after ${operationTimeout}ms for user: ${userId}`,
            );
          }

          // Get wallet with current version - optimized query (no lock needed, using optimistic locking)
          const wallet = await queryRunner.manager
            .createQueryBuilder(WalletEntity, "wallet")
            .where("wallet.userId = :userId", { userId })
            .getOne();

          if (!wallet) {
            throw new NotFoundException(`Wallet not found for user: ${userId}`);
          }

          const originalVersion = wallet.version;

          // Apply the update function
          updateFn(wallet);

          // Increment version for optimistic locking
          wallet.version = originalVersion + 1;
          wallet.updatedAt = new Date();

          // Update with version check - optimized for index usage, single query
          const result = await queryRunner.manager
            .createQueryBuilder()
            .update(WalletEntity)
            .set({
              totalCollections: wallet.totalCollections,
              totalPayinBalance: wallet.totalPayinBalance,
              availablePayoutBalance: wallet.availablePayoutBalance,
              version: wallet.version,
              updatedAt: wallet.updatedAt,
            })
            .where("userId = :userId AND version = :version", {
              userId,
              version: originalVersion,
            })
            .execute();

          if (result.affected === 0) {
            // Version conflict, retry with exponential backoff
            if (attempt === maxRetries - 1) {
              throw new Error(
                `Wallet update conflict after ${maxRetries} retries for user: ${userId}`,
              );
            }

            const delay = baseDelay * Math.pow(2, attempt);
            const jitter = Math.floor(Math.random() * delay * 0.5);
            await new Promise((resolve) => setTimeout(resolve, delay + jitter));
            continue;
          }

          this.logger.info(
            `Wallet updated successfully for user ${userId} on attempt ${attempt + 1}`,
            {
              userId,
              attempt: attempt + 1,
              newVersion: wallet.version,
              totalCollections: wallet.totalCollections,
              totalPayinBalance: wallet.totalPayinBalance,
              availablePayoutBalance: wallet.availablePayoutBalance,
            },
          );

          return wallet;
        } catch (error) {
          if (attempt === maxRetries - 1) {
            this.logger.error(
              `Failed to update wallet for user ${userId} after ${maxRetries} attempts`,
              error,
            );
            throw error;
          }

          const delay = baseDelay * Math.pow(2, attempt);
          const jitter = Math.floor(Math.random() * delay * 0.5);
          await new Promise((resolve) => setTimeout(resolve, delay + jitter));
        }
      }

      throw new Error(`Unexpected error in wallet update for user: ${userId}`);
    } finally {
      // ✅ Always release lock if we acquired it
      if (lockAcquired) {
        await this.cacheManager.del(lockKey);
      }
    }
  }

  /**
   * Update payin wallet balance
   */
  // protected async safeUpdatePayinWalletBalance(
  //   queryRunner: QueryRunner,
  //   userId: string,
  //   updateFn: (wallet: PayinWalletEntity) => void,
  // ): Promise<PayinWalletEntity> {
  //   const wallet = await queryRunner.manager.findOne(PayinWalletEntity, {
  //     where: { user: { id: userId } },
  //     relations: ["user"],
  //     lock: { mode: "pessimistic_write" },
  //   });

  //   if (!wallet) {
  //     throw new NotFoundException(`Payin wallet not found for user ${userId}`);
  //   }

  //   updateFn(wallet);
  //   return await queryRunner.manager.save(wallet);
  // }

  /**
   * Send webhook to user's webhook URL
   * Optimized with timeout to prevent hanging requests
   */
  protected async sendUserWebhook(
    user: UsersEntity,
    payload: {
      orderId: string;
      status: PAYMENT_STATUS;
      amount: number;
      txnRefId?: string;
      utr?: string;
      payerVpa?: string;
      message?: string;
    },
  ): Promise<void> {
    if (!user?.payInWebhookUrl) {
      return;
    }

    this.logger.info(
      `PAYIN - Going to call user PAYIN WEBHOOK (${user.payInWebhookUrl}) with payload: ${LoggerPlaceHolder.Json}`,
      payload,
    );

    try {
      // Add timeout to prevent hanging requests (5 seconds max)
      const { data } = await axios.post(user.payInWebhookUrl, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 5000, // 5 second timeout
        validateStatus: (status) => status < 500, // Don't throw on 4xx
      });

      this.logger.info(
        `PAYIN - User webhook (${user.payInWebhookUrl}) sent successfully RES: ${JSON.stringify(data)}`,
      );
    } catch (err: any) {
      // Don't throw - webhook failures shouldn't fail the main transaction
      if (err.code === "ECONNABORTED") {
        this.logger.warn(
          `PAYIN - User webhook timeout after 5s: ${user.payInWebhookUrl}`,
        );
      } else {
        this.logger.error(
          `PAYIN - Error while sending webhook to user: ${LoggerPlaceHolder.Json}`,
          err,
        );
      }
    }
  }

  /**
   * Process webhook - main entry point
   * Each integration must implement this method
   */
  abstract handleWebhook(webhookData: any): Promise<any>;
}
