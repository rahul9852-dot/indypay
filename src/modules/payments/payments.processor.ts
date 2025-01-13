import { Process, Processor } from "@nestjs/bull";
import { HttpStatus } from "@nestjs/common";
import { Job } from "bull";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import { FALKPAY } from "@/constants/external-api.constant";
import { getFlakPayPgConfig } from "@/utils/pg-config.utils";
import { appConfig } from "@/config/app.config";
import { AxiosService } from "@/shared/axios/axios.service";
import { IExternalPayoutResponseFlakPay } from "@/interface/external-api.interface";
import { CustomLogger } from "@/logger";
import { convertExternalPaymentStatusToInternal } from "@/utils/helperFunctions.utils";
import { PAYMENT_STATUS } from "@/enums/payment.enum";

const { externalPaymentConfig } = appConfig();

@Processor("payouts")
export class PayoutProcessor {
  private readonly logger = new CustomLogger(PayoutProcessor.name);
  constructor(
    @InjectRepository(PayOutOrdersEntity)
    private readonly payOutOrdersRepository: Repository<PayOutOrdersEntity>,
  ) {}

  @Process("process-payouts")
  async handlePayouts(
    job: Job<{
      payoutOrders: any[];
      userId: string;
      batchId: string;
    }>,
  ) {
    const { payoutOrders, userId, batchId } = job.data;
    const BATCH_SIZE = 10;
    const DELAY_BETWEEN_REQUESTS = 1000; // 1 second

    const axiosServiceFlakPay = new AxiosService(
      FALKPAY.BASE_URL,
      getFlakPayPgConfig({
        clientId: externalPaymentConfig.flakPay.clientId,
        clientSecret: externalPaymentConfig.flakPay.clientSecret,
      }),
    );

    // Process in smaller batches
    for (let i = 0; i < payoutOrders.length; i += BATCH_SIZE) {
      const batch = payoutOrders.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (order) => {
          try {
            await new Promise((resolve) =>
              setTimeout(resolve, DELAY_BETWEEN_REQUESTS),
            );

            const payload = {
              amount: order.amount,
              orderId: order.orderId,
              transferMode: order.transferMode,
              beneDetails: {
                beneBankName: order.beneficiaryName,
                beneAccountNo: order.accountNumber,
                beneIfsc: order.ifscCode,
                beneName: order.beneficiaryName,
              },
            };

            const response =
              await axiosServiceFlakPay.postRequest<IExternalPayoutResponseFlakPay>(
                FALKPAY.PAYOUT.LIVE,
                payload,
              );

            this.logger.info(
              `Payout processed for order: ${order.orderId}`,
              response,
            );

            if (response.statusCode !== HttpStatus.OK) {
              throw new Error(response.message);
            }

            const status = convertExternalPaymentStatusToInternal(
              response.data.status.toUpperCase(),
            );

            await this.payOutOrdersRepository.update(
              { id: order.id },
              {
                transferId: response.data.transferId,
                ...(status === PAYMENT_STATUS.SUCCESS && {
                  status,
                  successAt: new Date(),
                }),
                ...(status === PAYMENT_STATUS.FAILED && {
                  status,
                  failureAt: new Date(),
                }),
                ...(![PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.FAILED].includes(
                  status,
                ) && { status }),
              },
            );

            this.logger.info(`Payout processed successfully: ${order.orderId}`);
          } catch (error) {
            this.logger.error(
              `Payout failed for order: ${order.orderId}`,
              error,
            );

            await this.payOutOrdersRepository.update(
              { id: order.id },
              {
                status: PAYMENT_STATUS.FAILED,
                failureAt: new Date(),
              },
            );
          }
        }),
      );
    }
  }
}
