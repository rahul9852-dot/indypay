import { Injectable, Optional, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { InjectQueue } from "@nestjs/bull";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Queue } from "bull";
import { Cache } from "cache-manager";
import { DataSource, Repository } from "typeorm";
import { CreatePayinTransactionAnviNeoDto } from "../../dto/create-payin-payment.dto";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { UsersEntity } from "@/entities/user.entity";
import { CustomLogger } from "@/logger";
import { CommissionService } from "@/modules/commissions/commission.service";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { PAYMENT_METHOD } from "@/enums/payment-method.enum";

// O-5 fix: Sliding-window thresholds for dynamic job priority.
// Bull uses lower numbers as higher priority (1 = highest, MAX_INT = lowest).
// Merchants with few recent jobs go first; bursty merchants yield to idle ones.
const PRIORITY_HIGH = 1; // ≤ 10 jobs in the last 60 s
const PRIORITY_MEDIUM = 2; // ≤ 50 jobs
const PRIORITY_LOW = 3; // > 50 jobs
const PRIORITY_WINDOW_MS = 60_000; // 1-minute sliding window

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
    @Optional()
    @Inject(CACHE_MANAGER)
    protected readonly cacheManager?: Cache,
  ) {
    this.logger = new CustomLogger(this.constructor.name);
    this.commissionService = commissionService;
    this.payinQueue = payinQueue;
  }

  /**
   * O-5 fix: Returns a Bull job priority (1=highest, 3=lowest) for a merchant
   * based on how many jobs they have submitted in the last 60 seconds.
   *
   * This implements weighted-fair scheduling at zero infrastructure cost:
   * - An idle merchant always jumps to the front of the queue (priority 1).
   * - A merchant flooding the queue with bursts is demoted to priority 3,
   *   allowing all other merchants to be processed ahead of them.
   * - After their burst window expires (60 s), they reset back to priority 1.
   *
   * Bull processes jobs in strict priority order within each queue, so this
   * guarantees no single merchant can starve the rest indefinitely.
   */
  private async calculateMerchantPriority(userId: string): Promise<number> {
    if (!this.cacheManager) return PRIORITY_HIGH;

    const key = `queue:fairness:${userId}`;
    const current = (await this.cacheManager.get<number>(key)) ?? 0;
    const updated = current + 1;

    // Refresh the key each time so the window slides with activity.
    await this.cacheManager.set(key, updated, PRIORITY_WINDOW_MS);

    if (updated <= 10) return PRIORITY_HIGH;
    if (updated <= 50) return PRIORITY_MEDIUM;

    return PRIORITY_LOW;
  }

  /**
   * Creates a payin order synchronously in DB, then queues enrichment (commission +
   * transaction record) asynchronously.
   *
   * The DB insert must happen before the HTTP response is sent so that the unique
   * constraint on orderId fires within the request lifecycle. If a merchant retries
   * due to a network timeout, the idempotency check returns the existing order's
   * data instead of creating a duplicate.
   */
  protected async createPayinOrderAndTransaction(
    createPayinTransactionDto: CreatePayinTransactionAnviNeoDto,
    user: UsersEntity,
    paymentLink?: string,
    txnRefId?: string,
  ) {
    const { amount, email, mobile, name, orderId } = createPayinTransactionDto;
    const startTime = Date.now();

    // Idempotency: if this orderId was already processed, return the same response.
    // This handles the case where the merchant retries with the same orderId.
    const existingOrder = await this.payInOrdersRepository.findOne({
      where: { orderId },
      select: { orderId: true, intent: true },
    });

    if (existingOrder) {
      this.logger.warn(
        `[IDEMPOTENCY] Order ${orderId} already exists — returning existing response`,
      );

      return {
        orderId: existingOrder.orderId,
        intent: existingOrder.intent ?? paymentLink,
        message: "Payment Link Generated successfully",
      };
    }

    // Synchronous DB insert — must complete before the response is sent.
    // Two concurrent requests with the same orderId will race here; the second
    // will hit the DB unique constraint (error code 23505) and be handled below.
    let savedOrder: PayInOrdersEntity;
    try {
      savedOrder = await this.payInOrdersRepository.save(
        this.payInOrdersRepository.create({
          orderId,
          userId: user.id,
          amount,
          email,
          name,
          mobile,
          status: PAYMENT_STATUS.PENDING,
          paymentMethod: PAYMENT_METHOD.UPI,
          ...(paymentLink && { intent: paymentLink }),
          ...(txnRefId && { txnRefId }),
        }),
      );
    } catch (error: any) {
      // Unique constraint violation — a concurrent request won the race.
      // Fetch the winner's record and return it as-is (idempotent).
      if (error?.code === "23505") {
        this.logger.warn(
          `[IDEMPOTENCY] Race condition on orderId ${orderId} — returning existing order`,
        );
        const raceOrder = await this.payInOrdersRepository.findOne({
          where: { orderId },
          select: { orderId: true, intent: true },
        });

        return {
          orderId: raceOrder?.orderId ?? orderId,
          intent: raceOrder?.intent ?? paymentLink,
          message: "Payment Link Generated successfully",
        };
      }
      throw error;
    }

    // Queue enrichment (commission calculation + transaction record) asynchronously.
    // The order is already safely in the DB at this point.
    if (this.payinQueue) {
      // O-5 fix: Compute per-merchant priority so a single bursty merchant
      // cannot starve other merchants waiting in the same queue.
      const priority = await this.calculateMerchantPriority(user.id);

      await this.payinQueue.add(
        "enrich-payin-order",
        {
          orderId,
          userId: user.id,
          amount,
          payinOrderId: savedOrder.id,
        },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 50,
          priority,
        },
      );
    } else {
      this.logger.warn(
        `[PAYIN] Queue not available for orderId: ${orderId}. Order saved but enrichment skipped.`,
      );
    }

    const elapsed = Date.now() - startTime;
    this.logger.debug(
      `[PAYIN] ✅ Order ${orderId} saved + queued in ${elapsed}ms`,
    );

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
    createPayinTransactionDto: CreatePayinTransactionAnviNeoDto,
    user: UsersEntity,
  ): Promise<any>;
}
