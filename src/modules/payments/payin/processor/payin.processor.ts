import {
  Process,
  Processor,
  OnQueueFailed,
  OnQueueStalled,
} from "@nestjs/bull";
import { Job } from "bull";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { CustomLogger } from "@/logger";
import { PAYMENT_TYPE, SETTLEMENT_STATUS } from "@/enums/payment.enum";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";
import { CommissionService } from "@/modules/commissions/commission.service";
import { COMMISSION_TYPE, CHARGE_TYPE } from "@/enums/commission.enum";

// Job data for commission + transaction enrichment.
// The payin order itself is already in the DB before this job is queued.
interface PayinEnrichJobData {
  orderId: string;
  userId: string;
  amount: number;
  payinOrderId: number; // PK of the already-inserted PayInOrdersEntity
}

@Processor("payin-orders")
export class PayinProcessor {
  private readonly logger = new CustomLogger(PayinProcessor.name);

  constructor(
    private readonly commissionService: CommissionService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Enriches a payin order that was already inserted synchronously during the HTTP
   * request. This job handles the async work: commission calculation, transaction
   * record creation, and updating the order with the computed values.
   *
   * Separating insert (sync, in-request) from enrichment (async, queued) ensures
   * the unique constraint fires before the response goes out, making the payin API
   * idempotent against merchant retries.
   */
  @Process({ name: "enrich-payin-order", concurrency: 5 })
  async handlePayinOrderEnrichment(
    job: Job<PayinEnrichJobData>,
  ): Promise<void> {
    const startTime = Date.now();
    const { orderId, userId, amount, payinOrderId } = job.data;
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      // 1️⃣ Calculate commission
      const commission = await this.commissionService.calculateCommission(
        userId,
        amount,
        COMMISSION_TYPE.PAYIN,
      );

      // 2️⃣ INSERT transaction record
      const txn = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(TransactionsEntity)
        .values({
          id: getUlidId(ID_TYPE.TRANSACTIONS_KEY),
          userId,
          payInOrderId: payinOrderId,
          transactionType: PAYMENT_TYPE.PAYIN,
        })
        .execute();

      const txnId = txn.identifiers[0].id;

      // 3️⃣ UPDATE order with commission data and transaction reference
      const commissionInPercentage =
        commission.chargeType === CHARGE_TYPE.PERCENTAGE
          ? commission.chargeValue
          : (commission.commissionAmount / amount) * 100;

      await queryRunner.manager.update(
        PayInOrdersEntity,
        { id: payinOrderId },
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
      this.logger.debug(`[ENRICH] ✅ ${orderId} enriched in ${duration}ms`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[ENRICH] ❌ ${orderId} enrichment failed after ${duration}ms: ${error.message}`,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * A-2 fix: Dead Letter Queue handler.
   *
   * Bull retries a job up to `attempts` times. On every failure this hook fires.
   * We only act on the FINAL failure (attemptsMade >= maxAttempts) — earlier
   * failures are expected transient errors that will be retried.
   *
   * On final failure the payin order exists in DB (D-1 fix) but has NULL
   * commission fields and NULL txnRefId. A CRITICAL log ensures this surfaces
   * in any log-based alerting (CloudWatch Alarms, Grafana Loki, PagerDuty).
   *
   * Future: write to a `failed_jobs` table so ops can trigger manual re-enrichment
   * without needing to dig through Redis or logs.
   */
  @OnQueueFailed()
  async handleJobFailed(
    job: Job<PayinEnrichJobData>,
    error: Error,
  ): Promise<void> {
    const maxAttempts = job.opts.attempts ?? 3;
    const isFinalFailure = job.attemptsMade >= maxAttempts;

    if (isFinalFailure) {
      this.logger.error(
        `[DLQ] FINAL FAILURE — enrich-payin-order exhausted all ${maxAttempts} attempts. ` +
          `orderId=${job.data.orderId} userId=${job.data.userId} amount=${job.data.amount} ` +
          `payinOrderId=${job.data.payinOrderId}. ` +
          `Order exists in DB but commission fields are NULL and txnRefId is unset. ` +
          `Manual re-enrichment required. Error: ${error.message}`,
      );
    } else {
      this.logger.warn(
        `[ENRICH] Attempt ${job.attemptsMade}/${maxAttempts} failed for orderId=${job.data.orderId}: ${error.message}. Retrying...`,
      );
    }
  }

  /**
   * A-2 fix: Stalled job handler.
   *
   * A job becomes "stalled" when the processor crashes mid-execution (OOM kill,
   * PM2 restart, uncaught exception outside try/catch). Bull detects this after
   * the lock expires and re-queues the job. We log it so stalls are visible —
   * repeated stalls on the same job indicate a deterministic crash loop.
   */
  @OnQueueStalled()
  async handleJobStalled(job: Job<PayinEnrichJobData>): Promise<void> {
    this.logger.warn(
      `[DLQ] STALLED JOB detected — orderId=${job.data.orderId} will be re-queued by Bull. ` +
        `If this repeats, the enrichment logic is causing a crash loop.`,
    );
  }
}
