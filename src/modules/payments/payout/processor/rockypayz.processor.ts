import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import axios from "axios";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import { ROCKY } from "@/constants/external-api.constant";
import { AxiosService } from "@/shared/axios/axios.service";
import { IExternalRockyPayoutFundResponse } from "@/interface/external-api.interface";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";
import { convertExternalPaymentStatusToInternal } from "@/utils/helperFunctions.utils";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { WalletEntity } from "@/entities/wallet.entity";
import { UsersService } from "@/modules/users/users.service";
import { appConfig } from "@/config/app.config";

const {
  externalPaymentConfig: {
    rocky: { mid, apiKey },
  },
} = appConfig();

@Processor("rocky-payouts")
export class PayoutProcessorRocky {
  private readonly logger = new CustomLogger(PayoutProcessorRocky.name);
  constructor(
    @InjectRepository(PayOutOrdersEntity)
    private readonly payOutOrdersRepository: Repository<PayOutOrdersEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
    private readonly usersService: UsersService,
  ) {}

  @Process("process-rocky-payouts")
  async handlePayoutsRocky(
    job: Job<{
      payoutOrders: PayOutOrdersEntity[];
      userId: string;
      batchId: string;
    }>,
  ) {
    const { payoutOrders, userId, batchId: _ } = job.data;
    const BATCH_SIZE = 10;
    const DELAY_BETWEEN_REQUESTS = 1000; // 1 second
    // external API

    const axiosServiceBuckBox = new AxiosService(ROCKY.BASE_URL);

    const user = await this.usersService.findOne(userId);

    // Process in smaller batches
    for (let i = 0; i < payoutOrders.length; i += BATCH_SIZE) {
      const batch = payoutOrders.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (order) => {
          try {
            await new Promise((resolve) =>
              setTimeout(resolve, DELAY_BETWEEN_REQUESTS),
            );

            const rockyPayload = {
              mid,
              apikey: apiKey,
              route: 1,
              ref_no: order.payoutId,
              amount: order.amount,
              customer_name: order.name,
              account_number: order.bankAccountNumber,
              ifsc: order.bankIfsc,
              customer_mobile: order.beneficiaryMobile,
            };

            this.logger.info("ROCKY PAYOUT - BEFORE API CALL", rockyPayload);

            const responseRocky =
              await axiosServiceBuckBox.postRequest<IExternalRockyPayoutFundResponse>(
                ROCKY.PAYOUT.LIVE,
                rockyPayload,
              );
            this.logger.info(
              `ROCKY PAYOUT - AFTER API CALL ${LoggerPlaceHolder.Json}`,
              responseRocky,
            );

            const status = convertExternalPaymentStatusToInternal(
              responseRocky.data.status.toUpperCase(),
            );

            this.logger.info(
              `Rocky Converted Status: ${LoggerPlaceHolder.Json}`,
              responseRocky,
            );

            await this.payOutOrdersRepository.update(
              { id: order.id },
              {
                transferId: responseRocky.data.TXN_ID,
                utr: responseRocky.data.UTR,
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
                ) && {
                  status,
                }),
              },
            );

            if (status === PAYMENT_STATUS.FAILED) {
              await this.payOutOrdersRepository.update(
                { id: order.id },
                {
                  status: PAYMENT_STATUS.FAILED,
                  failureAt: new Date(),
                  transferId: responseRocky.data.TXN_ID,
                  utr: responseRocky.data.UTR,
                },
              );
              throw {
                status: PAYMENT_STATUS.FAILED,
                message: responseRocky.msg || "Payout failed",
              };
            }

            if (user?.payOutWebhookUrl) {
              const payOutOrder = await this.payOutOrdersRepository.findOne({
                where: { id: order.id },
              });

              this.logger.info(
                `Payout webhook payOutOrder: ${LoggerPlaceHolder.Json}`,
                payOutOrder.orderId,
              );
              const payload = {
                orderId: order.payoutId,
                status,
                amount: order.amount,
                txnRefId: responseRocky.data.TXN_ID,
                payoutId: order.payoutId,
                utr: responseRocky.data.UTR,
              };

              this.logger.info(
                `Payout webhook payload: ${LoggerPlaceHolder.Json}`,
                payload,
              );
              axios
                .post(user.payOutWebhookUrl, payload)
                .then(({ data }) => {
                  this.logger.info(
                    `Payout webhook sent successfully - ${user.payOutWebhookUrl} - ${order.orderId} RES: ${JSON.stringify(data)}`,
                  );
                })
                .catch((error) => {
                  this.logger.error(
                    `Payout webhook failed for order: ${order.orderId} : ${LoggerPlaceHolder.Json}`,
                    error,
                  );
                });
            }
          } catch (error) {
            const errorDetails = {
              message: error?.message || "Unknown error",
              status: error?.status,
              response: error?.response?.data || error?.response,
              stack: error?.stack,
              orderId: order.orderId,
              payoutId: order.payoutId,
            };
            this.logger.error(
              `Payout failed for order: ${order.orderId} : ${LoggerPlaceHolder.Json}`,
              errorDetails,
            );

            const { amount, orderId, payoutId, amountBeforeDeduction } = order;

            if (user?.payOutWebhookUrl) {
              const payload = {
                orderId,
                status: error.status,
                amount,
                txnRefId: null,
                payoutId,
                utr: null,
              };

              axios
                .post(user.payOutWebhookUrl, payload)
                .then(({ data }) => {
                  this.logger.info(
                    `Payout webhook sent successfully: ${order.orderId} RES: ${JSON.stringify(data)}`,
                  );
                })
                .catch((error) => {
                  this.logger.error(
                    `Payout webhook failed for order: ${order.orderId} : ${LoggerPlaceHolder.Json}`,
                    error,
                  );
                });
            }

            // Update wallet
            const wallet = await this.walletRepository.findOne({
              where: { user: { id: userId } },
              relations: { user: true },
            });

            if (
              error.status === PAYMENT_STATUS.REJECTED ||
              error.status === PAYMENT_STATUS.FAILED
            ) {
              // Immediately add back to wallet
              if (wallet) {
                await this.walletRepository.save(
                  this.walletRepository.create({
                    id: wallet.id,
                    availablePayoutBalance:
                      +wallet.availablePayoutBalance + +amountBeforeDeduction,
                  }),
                );
              }

              this.logger.info(
                `PAYOUT - REJECTED/FAILED - Wallet updated successfully - Wallet: ${LoggerPlaceHolder.Json}`,
                {
                  availablePayoutBalance: wallet.availablePayoutBalance,
                  amountBeforeDeduction,
                },
              );
            }

            await this.payOutOrdersRepository.update(
              { id: order.id },
              {
                status: error.status || PAYMENT_STATUS.FAILED,
                failureAt: new Date(),
              },
            );
          }
        }),
      );
    }
  }
}
