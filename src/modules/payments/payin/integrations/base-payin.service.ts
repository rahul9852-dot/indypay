import { Injectable, Optional, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { DataSource, Repository } from "typeorm";
import { CreatePayinTransactionFlaPayDto } from "../../dto/create-payin-payment.dto";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { UsersEntity } from "@/entities/user.entity";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { PAYMENT_METHOD } from "@/enums/payment-method.enum";
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
   * 🔥 FAST PATH: Create minimal payin order → queue → return immediately
   * NO commission calculation, NO transaction creation, NO heavy logic
   * Only essential fields inserted. Everything else handled async by processor.
   */
  protected async createPayinOrderAndTransaction(
    createPayinTransactionDto: CreatePayinTransactionFlaPayDto,
    user: UsersEntity,
    paymentLink?: string,
    txnRefId?: string,
  ) {
    const { amount, email, mobile, name, orderId } = createPayinTransactionDto;
    const startTime = Date.now();

    // 🔥 PHASE 1: Create MINIMAL order (only essential fields)
    // NO commission, NO GST, NO transaction - processor will enrich later
    const baseOrder = this.payInOrdersRepository.create({
      userId: user.id,
      amount,
      email,
      name,
      mobile,
      orderId,
      status: PAYMENT_STATUS.PENDING,
      paymentMethod: PAYMENT_METHOD.UPI,
      ...(txnRefId && { txnRefId }),
      ...(paymentLink && { intent: paymentLink }),
    });

    const savedOrder = await this.payInOrdersRepository.save(baseOrder);
    const insertTime = Date.now() - startTime;

    this.logger.debug(
      `[FAST-PATH] Minimal order created in ${insertTime}ms for orderId: ${orderId}`,
    );

    // 🔥 PHASE 2: Push to queue for async enrichment (commission, txn, etc.)
    if (this.payinQueue) {
      try {
        await this.payinQueue.add(
          "process-payin",
          {
            payinId: savedOrder.id,
            orderId: savedOrder.orderId,
            userId: user.id,
            amount,
            email,
            name,
            mobile,
            paymentLink,
          },
          {
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 2000,
            },
            removeOnComplete: 100,
            removeOnFail: 50,
          },
        );

        const totalTime = Date.now() - startTime;
        this.logger.info(
          `[FAST-PATH] ✅ Order ${orderId} queued in ${totalTime}ms - API responding immediately`,
        );

        // Return immediately - enrichment happens async
        return {
          orderId: savedOrder.orderId,
          intent: paymentLink,
          message: "Payment Link Generated successfully",
        };
      } catch (error: any) {
        this.logger.error(
          `[FAST-PATH] ❌ Failed to queue order ${orderId}: ${error.message}`,
        );
        // Continue - order is already created, processor can pick it up later
      }
    }

    // Return even if queue failed - order exists, can be processed later
    return {
      orderId: savedOrder.orderId,
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
