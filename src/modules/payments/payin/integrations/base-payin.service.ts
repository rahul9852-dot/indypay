import { Injectable, Optional, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { DataSource, Repository } from "typeorm";
import { CreatePayinTransactionAnviNeoDto } from "../../dto/create-payin-payment.dto";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { UsersEntity } from "@/entities/user.entity";
import { CustomLogger } from "@/logger";
import { CommissionService } from "@/modules/commissions/commission.service";

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
   * 🔥 ULTRA FAST PATH: Queue only → return immediately
   * NO DB insert, NO commission, NO transaction - ALL handled async by batch processor
   */
  protected async createPayinOrderAndTransaction(
    createPayinTransactionDto: CreatePayinTransactionAnviNeoDto,
    user: UsersEntity,
    paymentLink?: string,
    txnRefId?: string,
  ) {
    const { amount, email, mobile, name, orderId } = createPayinTransactionDto;
    const startTime = Date.now();

    // 🔥 ONLY QUEUE - processor will batch insert + enrich
    if (!this.payinQueue) {
      this.logger.error(
        `[ULTRA-FAST] ❌ Payin queue not available for orderId: ${orderId}. Queue injection failed.`,
      );
      throw new Error(
        "Payin queue not available. Please ensure BullModule is properly configured.",
      );
    }

    try {
      await this.payinQueue.add(
        "create-payin-order",
        {
          orderId,
          userId: user.id,
          amount,
          email,
          name,
          mobile,
          paymentLink,
          txnRefId,
        },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      );

      const queueTime = Date.now() - startTime;
      this.logger.debug(
        `[ULTRA-FAST] ✅ Order ${orderId} queued in ${queueTime}ms`,
      );

      return {
        orderId,
        intent: paymentLink,
        message: "Payment Link Generated successfully",
      };
    } catch (error: any) {
      this.logger.error(
        `[ULTRA-FAST] ❌ Queue failed for ${orderId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Abstract method - each integration must implement this
   */
  abstract createPayin(
    createPayinTransactionDto: CreatePayinTransactionAnviNeoDto,
    user: UsersEntity,
  ): Promise<any>;
}
