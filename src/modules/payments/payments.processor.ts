import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import axios from "axios";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import { ERTITECH } from "@/constants/external-api.constant";
import { AxiosService } from "@/shared/axios/axios.service";
import { IExternalEritecPayoutFundResponse } from "@/interface/external-api.interface";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";
import { convertExternalPaymentStatusToInternal } from "@/utils/helperFunctions.utils";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { WalletEntity } from "@/entities/wallet.entity";
import { UsersService } from "@/modules/users/users.service";
import { appConfig } from "@/config/app.config";
import { ThirdPartyAuthService } from "@/shared/third-party-auth/third-party-auth.service";
import { getEritechPgConfig } from "@/utils/pg-config.utils";

const {
  externalPaymentConfig: {
    flakPay: payBoltCredsFalkPay,
    ertech: payBoltCredsEritech,
  },
} = appConfig();

@Processor("payouts")
export class PayoutProcessor {
  private readonly logger = new CustomLogger(PayoutProcessor.name);
  constructor(
    @InjectRepository(PayOutOrdersEntity)
    private readonly payOutOrdersRepository: Repository<PayOutOrdersEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
    private readonly usersService: UsersService,
    private readonly thirdPartyAuthService: ThirdPartyAuthService,
  ) {}

  @Process("process-payouts")
  async handlePayouts(
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

    // Get authentication token from ThirdPartyAuthService
    const token = await this.thirdPartyAuthService.getEritechToken();

    const axiosErtech = new AxiosService(
      ERTITECH.BASE_URL,
      getEritechPgConfig({
        token,
        merchantId: payBoltCredsEritech.merchantId,
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

            const customerUniqueRef = order.orderId.split("_").join("");

            const eriTechPayload = {
              paymentDetails: {
                txnPaymode: order.transferMode,
                txnAmount: order.amount,
                beneIfscCode: order.bankIfsc,
                beneAccNum: order.bankAccountNumber,
                beneName: order.name,
                custUniqRef: customerUniqueRef,
                beneMobileNo: order.beneficiaryMobile,
                preferredBank: "ind",
              },
            };

            const getEncryptedPayload =
              await this.thirdPartyAuthService.getEncryptedPayload(
                eriTechPayload,
                token,
              );

            this.logger.info(`${LoggerPlaceHolder.Json}`, getEncryptedPayload);

            const responseEritech =
              await axiosErtech.postRequest<IExternalEritecPayoutFundResponse>(
                ERTITECH.PAYOUT.FUND,
                getEncryptedPayload,
              );

            if (!responseEritech.success) {
              const apiStatus = responseEritech.data?.status?.toUpperCase();

              if (apiStatus === PAYMENT_STATUS.REJECTED) {
                throw {
                  status: PAYMENT_STATUS.REJECTED,
                  message: responseEritech.message || "Payout rejected",
                };
              }

              throw {
                status: apiStatus,
                message: responseEritech.message || "Payout ertitechfailed",
              };
            }

            const eriTechDecryptedResponse =
              await this.thirdPartyAuthService.getDecryptedPayload(
                responseEritech.data.encryptedResponseData,
                token,
              );

            this.logger.info(
              `Ertitech Response: ${LoggerPlaceHolder.Json}`,
              eriTechDecryptedResponse,
            );

            const status = convertExternalPaymentStatusToInternal(
              eriTechDecryptedResponse.txn_status.transactionStatus.toUpperCase(),
            );

            this.logger.info(
              `Ertitech Converted Status: ${LoggerPlaceHolder.Json}`,
              status,
            );

            await this.payOutOrdersRepository.save(
              this.payOutOrdersRepository.create({
                id: order.id,
                transferId: eriTechDecryptedResponse.custUniqRef,
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

                utr: eriTechDecryptedResponse.txn_status.utrNo,
              }),
            );

            if (status === PAYMENT_STATUS.FAILED) {
              throw {
                status: PAYMENT_STATUS.FAILED,
                message: responseEritech.message || "Payout failed",
              };
            }

            if (status === PAYMENT_STATUS.REJECTED) {
              throw {
                status: PAYMENT_STATUS.REJECTED,
                message: responseEritech.message || "Payout rejected",
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
                txnRefId: eriTechDecryptedResponse.custUniqRef,
                payoutId: order.payoutId,
                utr: eriTechDecryptedResponse.utrNo,
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

            // this.logger.info(
            //   `Payout failed for order: ${order.orderId} : ${LoggerPlaceHolder.Json}`,
            //   order,
            // );

            // if (user?.payOutWebhookUrl) {
            //   const payload = {
            //     orderId,
            //     status: PAYMENT_STATUS.FAILED,
            //     amount,
            //     txnRefId: null,
            //     payoutId,
            //     utr: null,
            //   };
            //   // this.logger.error(
            //   //   `Payout webhook payload: ${LoggerPlaceHolder.Json}`,
            //   //   payload,
            //   // );

            //   axios
            //     .post(user.payOutWebhookUrl, payload)
            //     .then(({ data }) => {
            //       this.logger.info(
            //         `Payout webhook sent successfully - ${order.orderId} - ${user.payOutWebhookUrl} - RES: ${JSON.stringify(data)}`,
            //       );
            //     })
            //     .catch((error) => {
            //       this.logger.error(
            //         `Payout webhook failed for order: ${order.orderId} : ${LoggerPlaceHolder.Json}`,
            //         error,
            //       );
            //     });
            // }

            if (user?.payOutWebhookUrl) {
              const payload = {
                orderId,
                status: error.status,
                amount,
                txnRefId: null,
                payoutId,
                utr: null,
              };
              // this.logger.error(
              //   `Payout webhook payload: ${LoggerPlaceHolder.Json}`,
              //   payload,
              // );

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
