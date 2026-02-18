import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { UsersEntity } from "@/entities/user.entity";
import { CustomLogger } from "@/logger";
import { PAYMENT_TYPE } from "@/enums/payment.enum";
import { SETTLEMENT_STATUS } from "@/enums/payment.enum";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";
import { CommissionService } from "@/modules/commissions/commission.service";
import { COMMISSION_TYPE, CHARGE_TYPE } from "@/enums/commission.enum";
import { getCommissions } from "@/utils/commissions.utils";

interface PayinEnrichmentJobData {
  payinId: number; // Auto-increment ID
  orderId: string;
  userId: string;
  amount: number;
  email: string;
  name: string;
  mobile: string;
  paymentLink?: string;
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
   * 🔥 PHASE 2: Async enrichment worker
   * Handles: commission calculation, transaction creation, order updates
   * This removes all heavy DB work from API path
   */
  @Process({ name: "process-payin", concurrency: 100 })
  async handlePayinEnrichment(job: Job<PayinEnrichmentJobData>): Promise<void> {
    const startTime = Date.now();
    const { payinId, orderId, userId, amount, paymentLink } = job.data;

    try {
      // 1️⃣ Calculate commission (async - no API blocking)
      let commissionResult;
      try {
        commissionResult = await this.commissionService.calculateCommission(
          userId,
          amount,
          COMMISSION_TYPE.PAYIN,
        );
      } catch (error: any) {
        // Fallback to legacy calculation
        this.logger.warn(
          `Commission calc failed for ${orderId}, using legacy: ${error.message}`,
        );
        const user = await this.dataSource
          .getRepository(UsersEntity)
          .findOne({ where: { id: userId } });
        const legacy = getCommissions({
          amount,
          commissionInPercentage: user?.commissionInPercentagePayin || 4.5,
          gstInPercentage: user?.gstInPercentagePayin || 18,
        });
        commissionResult = {
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

      // 2️⃣ Create transaction and update order in single transaction
      await this.dataSource.transaction(async (manager) => {
        // Create transaction
        const transaction = this.transactionsRepository.create({
          id: getUlidId(ID_TYPE.TRANSACTIONS_KEY),
          userId,
          payInOrderId: payinId,
          transactionType: PAYMENT_TYPE.PAYIN,
        });
        const savedTxn = await manager.save(transaction);

        // Calculate commission percentage for backward compatibility
        const commissionInPercentage =
          commissionResult.chargeType === CHARGE_TYPE.PERCENTAGE
            ? commissionResult.chargeValue
            : (commissionResult.commissionAmount / amount) * 100;

        // Update order with all enrichment data
        await manager.update(
          PayInOrdersEntity,
          { id: payinId },
          {
            txnRefId: savedTxn.id,
            commissionAmount: commissionResult.commissionAmount,
            gstAmount: commissionResult.gstAmount,
            netPayableAmount: commissionResult.netPayableAmount,
            commissionInPercentage,
            gstInPercentage: commissionResult.gstPercentage,
            commissionId: commissionResult.commissionId || null,
            commissionSlabId: commissionResult.commissionSlabId || null,
            chargeType: commissionResult.chargeType || null,
            chargeValue: commissionResult.chargeValue || null,
            settlementStatus: SETTLEMENT_STATUS.NOT_INITIATED,
            ...(paymentLink && { intent: paymentLink }),
          },
        );
      });

      const duration = Date.now() - startTime;
      this.logger.debug(
        `[ENRICH] ✅ Order ${orderId} enriched in ${duration}ms`,
      );
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[ENRICH] ❌ Failed to enrich order ${orderId} after ${duration}ms: ${error.message}`,
      );
      throw error; // Let Bull retry
    }
  }
}
