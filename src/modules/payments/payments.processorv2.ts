import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import axios from "axios";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import { KDSPAYOUT } from "@/constants/external-api.constant";
import { AxiosService } from "@/shared/axios/axios.service";
import { IExternalKDSPayoutResponse } from "@/interface/external-api.interface";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";
import { convertExternalPaymentStatusToInternal } from "@/utils/helperFunctions.utils";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { WalletEntity } from "@/entities/wallet.entity";
import { UsersService } from "@/modules/users/users.service";
import { appConfig } from "@/config/app.config";
import { ThirdPartyAuthService } from "@/shared/third-party-auth/third-party-auth.service";
import { getKDSConfig } from "@/utils/pg-config.utils";

const {
  externalPaymentConfig: {
    kdsPayout: { kdsClientId, kdsClientSecret },
  },
} = appConfig();

@Processor("payouts-kds-payout")
export class PayoutProcessorDiasPay {
  private readonly logger = new CustomLogger(PayoutProcessorDiasPay.name);
  constructor(
    @InjectRepository(PayOutOrdersEntity)
    private readonly payOutOrdersRepository: Repository<PayOutOrdersEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
    private readonly usersService: UsersService,
    private readonly thirdPartyAuthService: ThirdPartyAuthService,
  ) {}

  @Process("process-payouts-kds-payout")
  async handlePayoutsDiasPay(
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

    const axiosKDSPayout = new AxiosService(
      KDSPAYOUT.BASE_URL,
      getKDSConfig({
        clientId: kdsClientId,
        clientSecret: kdsClientSecret,
      }),
    );
    const user = await this.usersService.findOne(userId);

    // Process in smaller batches
    for (let i = 0; i < payoutOrders.length; i += BATCH_SIZE) {
      const batch = payoutOrders.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (order) => {
          try {
            // this.logger.info(
            //   `Processing payout order: ${order.orderId} ORDER: ${LoggerPlaceHolder.Json}`,
            //   order,
            // );

            await new Promise((resolve) =>
              setTimeout(resolve, DELAY_BETWEEN_REQUESTS),
            );

            const AccountType = "CURRENT";
            const KDSPayoutPayload = {
              externalTxnId: order.orderId,
              type: "fund-transfer",
              mode: "IMPS",
              payeeName: order.name,
              payeeAccount: +order.bankAccountNumber,
              payeeIfsc: order.bankIfsc,
              amount: order.amount,
              sender_name: "RFP",
              latlong: "20.342639620957844, 85.81222573798418",
              payeeAcType: ["SAVINGS", "CURRENT"].includes(AccountType)
                ? AccountType
                : "SAVINGS",
              payeeBankName: order.bankName,
            };

            // const formData = new URLSearchParams();
            // Object.entries(diasPayPayload).forEach(([key, value]) => {
            //   formData.append(key, value.toString());
            // });

            this.logger.info(
              `kds Payout Payload: ${LoggerPlaceHolder.Json}`,
              KDSPayoutPayload,
            );

            const responseKDSPayout =
              await axiosKDSPayout.postRequest<IExternalKDSPayoutResponse>(
                KDSPAYOUT.PAYOUT.LIVE,
                KDSPAYOUT,
              );

            this.logger.info(
              `KDS Payout Response: ${LoggerPlaceHolder.Json}`,
              responseKDSPayout,
            );

            if (responseKDSPayout.status === PAYMENT_STATUS.FAILED) {
              throw {
                status: responseKDSPayout.status,
                message: "Error from third party Payout integration",
              };
            }

            const status = convertExternalPaymentStatusToInternal(
              responseKDSPayout.status.toUpperCase(),
            );

            this.logger.info(
              `KDS Payout Converted Status: ${LoggerPlaceHolder.Json}`,
              status,
            );

            await this.payOutOrdersRepository.save(
              this.payOutOrdersRepository.create({
                id: order.id,
                transferId: responseKDSPayout.data.externalTxnId,
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

                utr: responseKDSPayout.data.bank_ref_no,
              }),
            );

            if (status === PAYMENT_STATUS.FAILED) {
              throw {
                status: PAYMENT_STATUS.FAILED,
                message: "Payout failed",
              };
            }

            if (status === PAYMENT_STATUS.REJECTED) {
              throw {
                status: PAYMENT_STATUS.REJECTED,
                message: "Payout rejected",
              };
            }

            if (user?.payOutWebhookUrl) {
              const payOutOrder = await this.payOutOrdersRepository.findOne({
                where: { id: order.id },
              });

              this.logger.info(
                `Payout webhook payOutOrder: ${LoggerPlaceHolder.Json}`,
                payOutOrder,
              );
              const payload = {
                orderId: order.orderId,
                status,
                amount: order.amount,
                txnRefId: responseKDSPayout.data.externalTxnId,
                payoutId: order.payoutId,
                utr: responseKDSPayout.data.bank_ref_no,
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

            // this.logger.info(
            //   `Payout processed successfully: ${order.orderId} : ${LoggerPlaceHolder.Json}`,
            //   response.data,
            // );
          } catch (error) {
            this.logger.error(
              `Payout failed for order: ${order.orderId} : ${LoggerPlaceHolder.Json}`,
              JSON.stringify(error),
            );

            const { amount, orderId, payoutId } = order;

            if (user?.payOutWebhookUrl) {
              const payload = {
                orderId,
                status: PAYMENT_STATUS.FAILED,
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

            // if (wallet) {
            //   await this.walletRepository.save(
            //     this.walletRepository.create({
            //       id: wallet.id,
            //       availablePayoutBalance:
            //         +wallet.availablePayoutBalance + +amount,
            //     }),
            //   );
            // }

            // this.logger.info(
            //   `PAYOUT - Update wallet when error occurs(catch block) - Wallet: ${LoggerPlaceHolder.Json}`,
            //   {
            //     availablePayoutBalance: wallet.availablePayoutBalance,
            //     amount,
            //   },
            // );

            if (error.status === PAYMENT_STATUS.REJECTED) {
              // Immediately add back to wallet
              if (wallet) {
                await this.walletRepository.save(
                  this.walletRepository.create({
                    id: wallet.id,
                    availablePayoutBalance:
                      +wallet.availablePayoutBalance + +amount,
                  }),
                );
              }

              this.logger.info(
                `PAYOUT - REJECTED - Wallet updated successfully - Wallet: ${LoggerPlaceHolder.Json}`,
                {
                  availablePayoutBalance: wallet.availablePayoutBalance,
                  amount,
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
