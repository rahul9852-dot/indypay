import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { UsersEntity } from "@/entities/user.entity";
import { CustomLogger } from "@/logger";
import { PAYMENT_TYPE, PAYMENT_STATUS } from "@/enums/payment.enum";
import { SETTLEMENT_STATUS } from "@/enums/payment.enum";
import { PAYMENT_METHOD } from "@/enums/payment-method.enum";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";
import { CommissionService } from "@/modules/commissions/commission.service";
import { COMMISSION_TYPE, CHARGE_TYPE } from "@/enums/commission.enum";
import { getCommissions } from "@/utils/commissions.utils";

interface PayinOrderJobData {
  orderId: string;
  userId: string;
  amount: number;
  email: string;
  name: string;
  mobile: string;
  paymentLink?: string;
  txnRefId?: string;
}

@Processor("payin-orders")
export class PayinProcessor {
  private readonly logger = new CustomLogger(PayinProcessor.name);

  constructor(
    private readonly commissionService: CommissionService,
    @InjectRepository(PayInOrdersEntity)
    private readonly payInOrdersRepository: Repository<PayInOrdersEntity>,
    @InjectRepository(TransactionsEntity)
    private readonly transactionsRepository: Repository<TransactionsEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 🔥 OPTIMIZED: Separate inserts (no transaction wrapper)
   * Uses QueryRunner from pool for better concurrency
   */
  @Process({ name: "create-payin-order", concurrency: 50 })
  async handlePayinOrderCreation(job: Job<PayinOrderJobData>): Promise<void> {
    const startTime = Date.now();
    const order = job.data;
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      // 1️⃣ INSERT order (separate insert, no transaction wrapper)
      const insertResult = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(PayInOrdersEntity)
        .values({
          orderId: order.orderId,
          userId: order.userId,
          amount: order.amount,
          email: order.email,
          name: order.name,
          mobile: order.mobile,
          status: PAYMENT_STATUS.PENDING,
          paymentMethod: PAYMENT_METHOD.UPI,
          ...(order.paymentLink && { intent: order.paymentLink }),
          ...(order.txnRefId && { txnRefId: order.txnRefId }),
        })
        .execute();

      const payinId = insertResult.identifiers[0].id;

      // 2️⃣ Calculate commission (parallel, no DB blocking)
      const commission = await this.calculateCommissionSafe(
        order.userId,
        order.amount,
      );

      // 3️⃣ INSERT transaction (separate insert)
      const txn = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(TransactionsEntity)
        .values({
          id: getUlidId(ID_TYPE.TRANSACTIONS_KEY),
          userId: order.userId,
          payInOrderId: payinId,
          transactionType: PAYMENT_TYPE.PAYIN,
        })
        .execute();

      const txnId = txn.identifiers[0].id;

      // 4️⃣ UPDATE order (separate update)
      const commissionInPercentage =
        commission.chargeType === CHARGE_TYPE.PERCENTAGE
          ? commission.chargeValue
          : (commission.commissionAmount / order.amount) * 100;

      await queryRunner.manager.update(
        PayInOrdersEntity,
        { id: payinId },
        {
          txnRefId: txnId,
          commissionAmount: commission.commissionAmount,
          gstAmount: commission.gstAmount,
          netPayableAmount: commission.netPayableAmount,
          commissionInPercentage,
          gstInPercentage: commission.gstPercentage,
          commissionId: commission.commissionId || null,
          commissionSlabId: commission.commissionSlabId || null,
          chargeType: commission.chargeType || null,
          chargeValue: commission.chargeValue || null,
          settlementStatus: SETTLEMENT_STATUS.NOT_INITIATED,
        },
      );

      const duration = Date.now() - startTime;
      this.logger.debug(`[FAST] ✅ ${order.orderId} in ${duration}ms`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[FAST] ❌ ${order.orderId} failed after ${duration}ms: ${error.message}`,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Safe commission calculation with fallback
   */
  private async calculateCommissionSafe(
    userId: string,
    amount: number,
  ): Promise<any> {
    try {
      return await this.commissionService.calculateCommission(
        userId,
        amount,
        COMMISSION_TYPE.PAYIN,
      );
    } catch (error: any) {
      // Fallback to legacy
      const user = await this.dataSource
        .getRepository(UsersEntity)
        .findOne({ where: { id: userId } });
      const legacy = getCommissions({
        amount,
        commissionInPercentage: user?.commissionInPercentagePayin || 4.5,
        gstInPercentage: user?.gstInPercentagePayin || 18,
      });

      return {
        commissionAmount: legacy.commissionAmount,
        gstAmount: legacy.gstAmount,
        netPayableAmount: legacy.netPayableAmount,
        commissionId: null,
        commissionSlabId: null,
        chargeType: CHARGE_TYPE.PERCENTAGE,
        chargeValue: user?.commissionInPercentagePayin || 4.5,
        gstPercentage: user?.gstInPercentagePayin || 18,
      };
    }
  }
}
