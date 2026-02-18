import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { CustomLogger } from "@/logger";
import { PAYMENT_TYPE } from "@/enums/payment.enum";
import { PAYMENT_STATUS, SETTLEMENT_STATUS } from "@/enums/payment.enum";
import { PAYMENT_METHOD } from "@/enums/payment-method.enum";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";

interface PayinOrderJobData {
  userId: string;
  amount: number;
  email: string;
  name: string;
  mobile: string;
  orderId: string;
  commissionAmount: number;
  gstAmount: number;
  netPayableAmount: number;
  commissionInPercentage: number;
  gstInPercentage: number;
  txnRefId?: string;
  commissionId?: string;
  commissionSlabId?: string;
  chargeType?: string;
  chargeValue?: number;
  paymentLink?: string;
}

@Processor("payin-orders")
export class PayinProcessor {
  private readonly logger = new CustomLogger(PayinProcessor.name);

  constructor(
    @InjectRepository(PayInOrdersEntity)
    private readonly payInOrdersRepository: Repository<PayInOrdersEntity>,
    @InjectRepository(TransactionsEntity)
    private readonly transactionsRepository: Repository<TransactionsEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Process payin order creation jobs in batches
   * This reduces database load by batching multiple inserts together
   */
  @Process("create-payin-order")
  async handlePayinOrderCreation(job: Job<PayinOrderJobData>): Promise<void> {
    const startTime = Date.now();
    const { orderId } = job.data;

    try {
      this.logger.debug(
        `[PAYIN-QUEUE] Processing order creation for orderId: ${orderId}`,
      );

      // Use a transaction for atomicity
      await this.dataSource.transaction(async (manager) => {
        // Generate IDs
        const payinOrderId = getUlidId(ID_TYPE.PAYIN_KEY);
        const transactionId = getUlidId(ID_TYPE.TRANSACTIONS_KEY);

        // Insert payin order using raw SQL for performance
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
            job.data.userId,
            job.data.amount,
            job.data.email,
            job.data.name,
            job.data.mobile,
            job.data.commissionAmount,
            job.data.gstAmount,
            job.data.netPayableAmount,
            job.data.commissionInPercentage,
            job.data.gstInPercentage,
            job.data.orderId,
            job.data.txnRefId || null,
            job.data.commissionId || null,
            job.data.commissionSlabId || null,
            job.data.chargeType || null,
            job.data.chargeValue || null,
            PAYMENT_STATUS.PENDING,
            PAYMENT_METHOD.UPI,
            job.data.paymentLink || null,
            SETTLEMENT_STATUS.NOT_INITIATED,
            false,
          ],
        );

        // Insert transaction
        await manager.query(
          `INSERT INTO transactions (
            id, "userId", "payInOrderId", "transactionType", 
            "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [transactionId, job.data.userId, payinOrderId, PAYMENT_TYPE.PAYIN],
        );
      });

      const duration = Date.now() - startTime;
      this.logger.debug(
        `[PAYIN-QUEUE] ✅ Order created successfully in ${duration}ms for orderId: ${orderId}`,
      );
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[PAYIN-QUEUE] ❌ Failed to create order after ${duration}ms for orderId: ${orderId} - ${error.message}`,
      );
      // Re-throw to let Bull handle retries
      throw error;
    }
  }

  /**
   * Process multiple payin orders in a single batch
   * This is more efficient than processing one at a time
   */
  @Process("create-payin-orders-batch")
  async handlePayinOrdersBatch(
    job: Job<{ orders: PayinOrderJobData[] }>,
  ): Promise<void> {
    const { orders } = job.data;
    const startTime = Date.now();

    this.logger.debug(
      `[PAYIN-QUEUE] Processing batch of ${orders.length} orders`,
    );

    try {
      // Use a single transaction for all orders
      await this.dataSource.transaction(async (manager) => {
        // Prepare batch insert data
        const payinOrderValues: any[] = [];
        const transactionValues: any[] = [];
        const payinOrderIds: string[] = [];

        for (const orderData of orders) {
          const payinOrderId = getUlidId(ID_TYPE.PAYIN_KEY);
          const transactionId = getUlidId(ID_TYPE.TRANSACTIONS_KEY);
          payinOrderIds.push(payinOrderId);

          // Prepare payin order values
          payinOrderValues.push([
            payinOrderId,
            orderData.userId,
            orderData.amount,
            orderData.email,
            orderData.name,
            orderData.mobile,
            orderData.commissionAmount,
            orderData.gstAmount,
            orderData.netPayableAmount,
            orderData.commissionInPercentage,
            orderData.gstInPercentage,
            orderData.orderId,
            orderData.txnRefId || null,
            orderData.commissionId || null,
            orderData.commissionSlabId || null,
            orderData.chargeType || null,
            orderData.chargeValue || null,
            PAYMENT_STATUS.PENDING,
            PAYMENT_METHOD.UPI,
            orderData.paymentLink || null,
            SETTLEMENT_STATUS.NOT_INITIATED,
            false,
          ]);

          // Prepare transaction values
          transactionValues.push([
            transactionId,
            orderData.userId,
            payinOrderId,
            PAYMENT_TYPE.PAYIN,
          ]);
        }

        // Batch insert payin orders
        if (payinOrderValues.length > 0) {
          const placeholders = payinOrderValues
            .map(
              (_, idx) =>
                `($${idx * 22 + 1}, $${idx * 22 + 2}, $${idx * 22 + 3}, $${idx * 22 + 4}, $${idx * 22 + 5}, $${idx * 22 + 6}, $${idx * 22 + 7}, $${idx * 22 + 8}, $${idx * 22 + 9}, $${idx * 22 + 10}, $${idx * 22 + 11}, $${idx * 22 + 12}, $${idx * 22 + 13}, $${idx * 22 + 14}, $${idx * 22 + 15}, $${idx * 22 + 16}, $${idx * 22 + 17}, $${idx * 22 + 18}, $${idx * 22 + 19}, $${idx * 22 + 20}, $${idx * 22 + 21}, $${idx * 22 + 22}, NOW(), NOW())`,
            )
            .join(", ");

          await manager.query(
            `INSERT INTO payin_orders (
              id, "userId", amount, email, name, mobile, 
              "commissionAmount", "gstAmount", "netPayableAmount", 
              "commissionInPercentage", "gstInPercentage", 
              "orderId", "txnRefId", "commissionId", "commissionSlabId", 
              "chargeType", "chargeValue", status, "paymentMethod", 
              intent, "settlementStatus", "isMisspelled", 
              "createdAt", "updatedAt"
            ) VALUES ${placeholders}`,
            payinOrderValues.flat(),
          );
        }

        // Batch insert transactions
        if (transactionValues.length > 0) {
          const placeholders = transactionValues
            .map(
              (_, idx) =>
                `($${idx * 4 + 1}, $${idx * 4 + 2}, $${idx * 4 + 3}, $${idx * 4 + 4}, NOW(), NOW())`,
            )
            .join(", ");

          await manager.query(
            `INSERT INTO transactions (
              id, "userId", "payInOrderId", "transactionType", 
              "createdAt", "updatedAt"
            ) VALUES ${placeholders}`,
            transactionValues.flat(),
          );
        }
      });

      const duration = Date.now() - startTime;
      this.logger.info(
        `[PAYIN-QUEUE] ✅ Batch of ${orders.length} orders created successfully in ${duration}ms (avg: ${(duration / orders.length).toFixed(2)}ms per order)`,
      );
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `[PAYIN-QUEUE] ❌ Failed to create batch after ${duration}ms - ${error.message}`,
      );
      throw error;
    }
  }
}
