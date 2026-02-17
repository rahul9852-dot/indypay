import { Injectable, Optional, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { CreatePayinTransactionFlaPayDto } from "../../dto/create-payin-payment.dto";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { UsersEntity } from "@/entities/user.entity";
import { PAYMENT_TYPE } from "@/enums/payment.enum";
import { getCommissions } from "@/utils/commissions.utils";
import { CustomLogger } from "@/logger";
import { LoggerPlaceHolder } from "@/logger";
import { CommissionService } from "@/modules/commissions/commission.service";
import { COMMISSION_TYPE, CHARGE_TYPE } from "@/enums/commission.enum";

/**
 * Base service for payin integrations
 * Contains common logic for creating payin orders and transactions
 */
@Injectable()
export abstract class BasePayinService {
  protected readonly logger: CustomLogger;

  protected commissionService?: CommissionService;

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
  ) {
    this.logger = new CustomLogger(this.constructor.name);
    this.commissionService = commissionService;
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

    // Wrap DB operations in a transaction
    const transactionStart = Date.now();
    let result;
    try {
      result = await this.dataSource.transaction(async (manager) => {
        // ✅ OPTIMIZED: Create entity with only userId (not full user object) for faster processing
        const payinOrder = this.payInOrdersRepository.create({
          userId: user.id, // Use userId directly instead of full user object
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
          txnRefId,
          commissionId,
          commissionSlabId,
          chargeType,
          chargeValue,
          ...(paymentLink && { intent: paymentLink }),
        });
        const orderSaveStart = Date.now();
        const savedPayinOrder = await manager.save(payinOrder);
        const orderSaveTime = Date.now() - orderSaveStart;

        // ✅ OPTIMIZED: Create transaction with only IDs (not full objects)
        const transaction = this.transactionsRepository.create({
          userId: user.id, // Use userId directly
          payInOrderId: savedPayinOrder.id, // Use payInOrderId directly
          transactionType: PAYMENT_TYPE.PAYIN,
        });
        const txnSaveStart = Date.now();
        await manager.save(transaction);
        const txnSaveTime = Date.now() - txnSaveStart;

        this.logger.debug(
          `[ORDER] Transaction completed - order save: ${orderSaveTime}ms, txn save: ${txnSaveTime}ms`,
        );

        return {
          orderId,
          intent: paymentLink,
          message: "Payment Link Generated successfully",
        };
      });
      const transactionTime = Date.now() - transactionStart;
      this.logger.debug(
        `[ORDER] Database transaction completed in ${transactionTime}ms for orderId: ${orderId}`,
      );
    } catch (error: any) {
      const transactionTime = Date.now() - transactionStart;
      this.logger.error(
        `[ORDER] ❌ Database transaction FAILED after ${transactionTime}ms for orderId: ${orderId} - ${error.message}`,
      );
      // Re-throw to let caller handle it
      throw error;
    }

    // ✅ OPTIMIZED: Move logging outside transaction to reduce transaction duration
    this.logger.info(
      `PAYIN CREATED: ${LoggerPlaceHolder.Json}`,
      createPayinTransactionDto,
    );

    return result;
  }

  /**
   * Abstract method - each integration must implement this
   */
  abstract createPayin(
    createPayinTransactionDto: CreatePayinTransactionFlaPayDto,
    user: UsersEntity,
  ): Promise<any>;
}
