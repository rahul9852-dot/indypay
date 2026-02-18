import { Injectable, Optional, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { DataSource, Repository } from "typeorm";
import { CreatePayinTransactionFlaPayDto } from "../../dto/create-payin-payment.dto";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { UsersEntity } from "@/entities/user.entity";
import { PAYMENT_TYPE } from "@/enums/payment.enum";
import { PAYMENT_STATUS, SETTLEMENT_STATUS } from "@/enums/payment.enum";
import { PAYMENT_METHOD } from "@/enums/payment-method.enum";
import { getCommissions } from "@/utils/commissions.utils";
import { CustomLogger } from "@/logger";
import { LoggerPlaceHolder } from "@/logger";
import { CommissionService } from "@/modules/commissions/commission.service";
import { COMMISSION_TYPE, CHARGE_TYPE } from "@/enums/commission.enum";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";

/**
 * Base service for payin integrations
 * Contains common logic for creating payin orders and transactions
 */
@Injectable()
export abstract class BasePayinService {
  protected readonly logger: CustomLogger;

  protected commissionService?: CommissionService;

  protected payinQueue?: Queue;

  constructor(
    @InjectRepository(PayInOrdersEntity)
    protected readonly payInOrdersRepository: Repository<PayInOrdersEntity>,
    @InjectRepository(TransactionsEntity)
    protected readonly transactionsRepository: Repository<TransactionsEntity>,
    @InjectDataSource()
    protected readonly dataSource: DataSource,
    @Optional()
    @Inject(forwardRef(() => CommissionService))
    commissionService?: CommissionService,
    @Optional()
    @InjectQueue("payin-orders")
    payinQueue?: Queue,
  ) {
    this.logger = new CustomLogger(this.constructor.name);
    this.commissionService = commissionService;
    this.payinQueue = payinQueue;
  }

  /**
   * Common method to create payin order and transaction
   * All integrations use this to save to database
   * Uses dynamic commission calculation if CommissionService is available
   */
  protected async createPayinOrderAndTransaction(
    createPayinTransactionDto: CreatePayinTransactionFlaPayDto,
    user: UsersEntity,
    paymentLink?: string,
    txnRefId?: string,
  ) {
    const { amount, email, mobile, name, orderId } = createPayinTransactionDto;

    let commissionAmount: number;
    let gstAmount: number;
    let netPayableAmount: number;
    let commissionId: string | null = null;
    let commissionSlabId: string | null = null;
    let chargeType: string | null = null;
    let chargeValue: number | null = null;
    let commissionInPercentage: number =
      user.commissionInPercentagePayin || 4.5;
    let gstInPercentage: number = user.gstInPercentagePayin || 18;

    // Try to use dynamic commission if service is available
    if (this.commissionService) {
      try {
        this.logger.debug(
          `[COMMISSION] Starting commission calculation for user ${user.id}, amount ${amount}`,
        );
        const commissionStartTime = Date.now();
        const commissionResult =
          await this.commissionService.calculateCommission(
            user.id,
            amount,
            COMMISSION_TYPE.PAYIN,
          );
        const commissionTime = Date.now() - commissionStartTime;
        this.logger.debug(
          `[COMMISSION] Commission calculated in ${commissionTime}ms for user ${user.id}`,
        );

        commissionAmount = commissionResult.commissionAmount;
        gstAmount = commissionResult.gstAmount;
        netPayableAmount = commissionResult.netPayableAmount;
        commissionId = commissionResult.commissionId;
        commissionSlabId = commissionResult.commissionSlabId;
        chargeType = commissionResult.chargeType;
        chargeValue = commissionResult.chargeValue;
        gstInPercentage = commissionResult.gstPercentage;

        // For backward compatibility, calculate percentage equivalent
        if (commissionResult.chargeType === CHARGE_TYPE.PERCENTAGE) {
          commissionInPercentage = commissionResult.chargeValue;
        } else {
          // For flat charges, calculate equivalent percentage
          commissionInPercentage = (commissionAmount / amount) * 100;
        }
      } catch (error: any) {
        // Fallback to legacy commission calculation
        this.logger.warn(
          `Failed to calculate dynamic commission for user ${user.id}, falling back to legacy: ${error.message}`,
        );
        const legacyCommission = getCommissions({
          amount,
          commissionInPercentage: user.commissionInPercentagePayin || 4.5,
          gstInPercentage: user.gstInPercentagePayin || 18,
        });
        commissionAmount = legacyCommission.commissionAmount;
        gstAmount = legacyCommission.gstAmount;
        netPayableAmount = legacyCommission.netPayableAmount;
      }
    } else {
      // No commission service available, use legacy calculation
      const legacyCommission = getCommissions({
        amount,
        commissionInPercentage: user.commissionInPercentagePayin || 4.5,
        gstInPercentage: user.gstInPercentagePayin || 18,
      });
      commissionAmount = legacyCommission.commissionAmount;
      gstAmount = legacyCommission.gstAmount;
      netPayableAmount = legacyCommission.netPayableAmount;
    }

    // ✅ OPTIMIZED: Queue-based async processing for better scalability
    // If queue is available, use it for async DB writes (decouples API from DB)
    // Otherwise, fall back to synchronous writes (backward compatibility)
    let useQueue = false;
    if (this.payinQueue) {
      // Queue the DB write job - API responds immediately
      const queueStart = Date.now();
      try {
        await this.payinQueue.add(
          "create-payin-order",
          {
            userId: user.id,
            amount,
            email,
            name,
            mobile,
            orderId,
            commissionAmount,
            gstAmount,
            netPayableAmount,
            commissionInPercentage,
            gstInPercentage,
            txnRefId,
            commissionId,
            commissionSlabId,
            chargeType,
            chargeValue,
            paymentLink,
          },
          {
            attempts: 3, // Retry up to 3 times on failure
            backoff: {
              type: "exponential",
              delay: 2000, // Start with 2s delay
            },
            removeOnComplete: 100, // Keep last 100 completed jobs
            removeOnFail: 50, // Keep last 50 failed jobs
          },
        );
        const queueTime = Date.now() - queueStart;
        this.logger.debug(
          `[ORDER] ✅ Queued order creation in ${queueTime}ms for orderId: ${orderId}`,
        );
        useQueue = true; // Successfully queued
      } catch (error: any) {
        const queueTime = Date.now() - queueStart;
        this.logger.error(
          `[ORDER] ❌ Failed to queue order after ${queueTime}ms for orderId: ${orderId} - ${error.message}. Falling back to sync write.`,
        );
        // Will fall through to synchronous write
      }
    }

    // Fallback: Synchronous write (if queue unavailable or failed)
    if (!useQueue) {
      const transactionStart = Date.now();
      let result;
      try {
        this.logger.debug(
          `[ORDER] Starting synchronous database transaction for orderId: ${orderId}`,
        );

        result = await this.dataSource.transaction(async (manager) => {
          const payinOrderId = getUlidId(ID_TYPE.PAYIN_KEY);
          const transactionId = getUlidId(ID_TYPE.TRANSACTIONS_KEY);

          await manager.query(
            `INSERT INTO payin_orders (
              id, "userId", amount, email, name, mobile, 
              "commissionAmount", "gstAmount", "netPayableAmount", 
              "commissionInPercentage", "gstInPercentage", 
              "orderId", "txnRefId", "commissionId", "commissionSlabId", 
              "chargeType", "chargeValue", status, "paymentMethod", 
              intent, "settlementStatus", "isMisspelled", 
              "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW(), NOW())`,
            [
              payinOrderId,
              user.id,
              amount,
              email,
              name,
              mobile,
              commissionAmount,
              gstAmount,
              netPayableAmount,
              commissionInPercentage,
              gstInPercentage,
              orderId,
              txnRefId || null,
              commissionId || null,
              commissionSlabId || null,
              chargeType || null,
              chargeValue || null,
              PAYMENT_STATUS.PENDING,
              PAYMENT_METHOD.UPI,
              paymentLink || null,
              SETTLEMENT_STATUS.NOT_INITIATED,
              false,
            ],
          );

          await manager.query(
            `INSERT INTO transactions (
              id, "userId", "payInOrderId", "transactionType", 
              "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, NOW(), NOW())`,
            [transactionId, user.id, payinOrderId, PAYMENT_TYPE.PAYIN],
          );

          return {
            orderId,
            intent: paymentLink,
            message: "Payment Link Generated successfully",
          };
        });
        const transactionTime = Date.now() - transactionStart;
        this.logger.info(
          `[ORDER] ✅ Synchronous database transaction completed in ${transactionTime}ms for orderId: ${orderId}`,
        );
      } catch (error: any) {
        const transactionTime = Date.now() - transactionStart;
        this.logger.error(
          `[ORDER] ❌ Synchronous database transaction FAILED after ${transactionTime}ms for orderId: ${orderId} - ${error.message}`,
        );
        throw error;
      }
    }

    // ✅ OPTIMIZED: Move logging outside transaction to reduce transaction duration
    this.logger.info(
      `PAYIN CREATED: ${LoggerPlaceHolder.Json}`,
      createPayinTransactionDto,
    );

    // Return response immediately (DB write happens async via queue)
    return {
      orderId,
      intent: paymentLink,
      message: "Payment Link Generated successfully",
    };
  }

  /**
   * Abstract method - each integration must implement this
   */
  abstract createPayin(
    createPayinTransactionDto: CreatePayinTransactionFlaPayDto,
    user: UsersEntity,
  ): Promise<any>;
}
