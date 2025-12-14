import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import axios from "axios";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import { GEOPAY } from "@/constants/external-api.constant";
import { AxiosService } from "@/shared/axios/axios.service";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";
import { convertExternalPaymentStatusToInternal } from "@/utils/helperFunctions.utils";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { WalletEntity } from "@/entities/wallet.entity";
import { UsersService } from "@/modules/users/users.service";
import { appConfig } from "@/config/app.config";
import { IExternalGeoPayPayoutResponse } from "@/interface/external-api.interface";

const {
  geopay: { agentId, secretKey },
} = appConfig();

@Processor("Geopay-payouts")
export class PayoutProcessorGeopay {
  private readonly logger = new CustomLogger(PayoutProcessorGeopay.name);
  constructor(
    @InjectRepository(PayOutOrdersEntity)
    private readonly payOutOrdersRepository: Repository<PayOutOrdersEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
    private readonly usersService: UsersService,
  ) {}

  @Process("process-geopay-payouts")
  async handlePayoutsGeoPay(
    job: Job<{
      payoutOrders: PayOutOrdersEntity[];
      userId: string;
      batchId: string;
    }>,
  ) {
    this.logger.info(`Processing GeoPay Payouts Job ID: ${job.id}`);
    const { payoutOrders, userId, batchId: _ } = job.data;
    const BATCH_SIZE = 10;
    const DELAY_BETWEEN_REQUESTS = 1000; // 1 second
    // external API

    const axiosServiceGeo = new AxiosService(GEOPAY.BASE_URL);

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

            const geoPayPayload = {
              agentId,
              secretKey,
              partnertxnid: order.orderId,
              bank_name: order.bankName,
              account_number: order.bankAccountNumber,
              ifsc: order.bankIfsc,
              beneficiary_name: order.name,
              mobile: order.beneficiaryMobile,
              amount: order.amount,
              payment_type: "IMPS",
            };

            const responseGeo =
              await axiosServiceGeo.postRequest<IExternalGeoPayPayoutResponse>(
                GEOPAY.PAYOUT.LIVE,
                geoPayPayload,
              );

            this.logger.info(
              `Geo Pay Payout Response: ${LoggerPlaceHolder.Json}`,
              responseGeo,
            );

            const status = convertExternalPaymentStatusToInternal(
              responseGeo.status.toUpperCase(),
            );

            this.logger.info(
              `Geo Converted Status: ${LoggerPlaceHolder.Json}`,
              responseGeo,
            );

            await this.payOutOrdersRepository.save(
              this.payOutOrdersRepository.create({
                id: order.id,
                transferId: responseGeo.partnertxnid,
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

                utr: responseGeo.utr,
              }),
            );

            if (status === PAYMENT_STATUS.FAILED) {
              throw {
                status: PAYMENT_STATUS.FAILED,
                message: responseGeo.resp_msg || "Payout failed",
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
                orderId: order.orderId,
                status,
                amount: order.amount,
                // txnRefId: responseGeo.,
                payoutId: order.payoutId,
                utr: responseGeo.utr,
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
            this.logger.error(
              `Payout failed for order: ${order.orderId} : ${LoggerPlaceHolder.Json}`,
              error || error.message,
            );

            const { amount, orderId, payoutId, amountBeforeDeduction } = order;

            if (user?.payOutWebhookUrl) {
              const payload = {
                orderId,
                status: error.status,
                amount,
                // txnRefId: null,
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
