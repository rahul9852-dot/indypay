import { Process, Processor } from "@nestjs/bull";
import { BadRequestException, HttpStatus } from "@nestjs/common";
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
import { WalletEntity } from "@/entities/wallet.entity";

const { externalPaymentConfig } = appConfig();

@Processor("payouts")
export class PayoutProcessor {
  private readonly logger = new CustomLogger(PayoutProcessor.name);
  constructor(
    @InjectRepository(PayOutOrdersEntity)
    private readonly payOutOrdersRepository: Repository<PayOutOrdersEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
  ) {}

  @Process("process-payouts")
  async handlePayouts(
    job: Job<{
      payoutOrders: PayOutOrdersEntity[];
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
                beneBankName: order.bankName,
                beneAccountNo: order.bankAccountNumber,
                beneIfsc: order.bankIfsc,
                beneName: order.name,
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

            if (status === PAYMENT_STATUS.FAILED) {
              throw new Error(response.message || "Payout failed");
            }

            await this.payOutOrdersRepository.update(
              { id: order.id },
              {
                transferId: response.data.transferId,
                ...(status === PAYMENT_STATUS.SUCCESS && {
                  status,
                  successAt: new Date(),
                }),
                ...(![PAYMENT_STATUS.SUCCESS].includes(status) && { status }),
              },
            );

            this.logger.info(`Payout processed successfully: ${order.orderId}`);
          } catch (error) {
            this.logger.error(
              `Payout failed for order: ${order.orderId}`,
              error,
            );

            const { amount } = order;

            // Update wallet
            const wallet = await this.walletRepository.findOne({
              where: { user: { id: userId } },
              relations: { user: true },
            });

            if (wallet) {
              const commissionRate =
                +wallet.user.commissionInPercentagePayout / 100;
              const gstRate =
                (commissionRate * +wallet.user.gstInPercentagePayout) / 100;

              const totalDeductionRate = commissionRate + gstRate;

              if (totalDeductionRate >= 1) {
                throw new BadRequestException(
                  "Invalid rates: Total deduction cannot be equal or greater than 1.",
                );
              }
              const actualAmount = +amount / (1 + totalDeductionRate / 100);
              const serviceCharge = +amount - actualAmount;

              await this.walletRepository.save(
                this.walletRepository.create({
                  id: wallet.id,
                  availablePayoutBalance:
                    +wallet.availablePayoutBalance + amount,
                  totalPayout: +wallet.totalPayout - +actualAmount,
                  payoutServiceCharge:
                    +wallet.payoutServiceCharge + serviceCharge,
                }),
              );
            }

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
