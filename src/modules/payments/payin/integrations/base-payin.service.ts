import { Injectable, Optional, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
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
        const commissionResult =
          await this.commissionService.calculateCommission(
            user.id,
            amount,
            COMMISSION_TYPE.PAYIN,
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
    return await this.dataSource.transaction(async (manager) => {
      // Create payin order
      const payinOrder = this.payInOrdersRepository.create({
        user,
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
      const savedPayinOrder = await manager.save(payinOrder);

      // Create transaction
      const transaction = this.transactionsRepository.create({
        user,
        payInOrder: savedPayinOrder,
        transactionType: PAYMENT_TYPE.PAYIN,
      });
      await manager.save(transaction);

      this.logger.info(
        `PAYIN CREATED: ${LoggerPlaceHolder.Json}`,
        createPayinTransactionDto,
      );

      return {
        orderId,
        intent: paymentLink,
        message: "Payment Link Generated successfully",
      };
    });
  }

  /**
   * Abstract method - each integration must implement this
   */
  abstract createPayin(
    createPayinTransactionDto: CreatePayinTransactionFlaPayDto,
    user: UsersEntity,
  ): Promise<any>;
}
