import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import axios from "axios";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import { FALKPAY } from "@/constants/external-api.constant";
import { getFlakPayPgConfig } from "@/utils/pg-config.utils";
import { AxiosService } from "@/shared/axios/axios.service";
import { IExternalPayoutResponseFlakPay } from "@/interface/external-api.interface";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";
import { convertExternalPaymentStatusToInternal } from "@/utils/helperFunctions.utils";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { WalletEntity } from "@/entities/wallet.entity";
import { UsersService } from "@/modules/users/users.service";
import { appConfig } from "@/config/app.config";

const {
  externalPaymentConfig: { flakPay: payBoltCredsFalkPay },
} = appConfig();

@Processor("payouts")
export class PayoutProcessor {
  private readonly logger = new CustomLogger(PayoutProcessor.name);
  constructor(
    @InjectRepository(PayOutOrdersEntity)
    private readonly payOutOrdersRepository: Repository<PayOutOrdersEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
    // @InjectRepository(ApiCredentialsEntity)
    // private readonly apiCredentialsRepository: Repository<ApiCredentialsEntity>,
    private readonly usersService: UsersService,
  ) {}

  // private async getFlakPayCredentials(userId: string) {
  //   const credentials = await this.apiCredentialsRepository.findOne({
  //     where: { user: { id: userId } },
  //     relations: { user: true },
  //   });

  //   if (!credentials) {
  //     throw new BadRequestException("Credentials not found");
  //   }

  //   const decryptedCredentials = await decryptData(credentials.credentials);
  //   const { clientId, clientSecret } = JSON.parse(decryptedCredentials);

  //   if (
  //     !clientId ||
  //     !clientSecret ||
  //     typeof clientId !== "string" ||
  //     typeof clientSecret !== "string"
  //   ) {
  //     throw new BadRequestException("Invalid credentials");
  //   }

  //   return { clientId, clientSecret };
  // }

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

    const { clientId, clientSecret } = payBoltCredsFalkPay;

    const axiosServiceFlakPay = new AxiosService(
      FALKPAY.BASE_URL,
      getFlakPayPgConfig({
        clientId,
        clientSecret,
      }),
    );

    // const axiosServiceIsmart = new AxiosService(
    //   ISMART_PAY.BASE_URL,
    //   getIsmartPayPgConfig({
    //     clientId: externalPaymentConfig.ismart.clientId,
    //     clientSecret: externalPaymentConfig.ismart.clientSecret,
    //   }),
    // );

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

            const payloadFlakPay = {
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

            // const payloadIsmart: IExternalPayoutRequestIsmart = {
            //   amount: order.amount,
            //   currency: "INR",
            //   narration: order.remarks,
            //   order_id: order.orderId,
            //   phone_number: order.user.mobile,
            //   purpose: order.purpose,
            //   payment_details: {
            //     account_number: order.bankAccountNumber,
            //     ifsc_code: order.bankIfsc,
            //     beneficiary_name: order.name,
            //     type: "NB",
            //     mode: order.transferMode as PAYOUT_PAYMENT_MODE,
            //   },
            // };

            const response =
              await axiosServiceFlakPay.postRequest<IExternalPayoutResponseFlakPay>(
                FALKPAY.PAYOUT.LIVE,
                payloadFlakPay,
              );

            // const response =
            //   await axiosServiceIsmart.postRequest<IExternalPayoutResponseIsmart>(
            //     ISMART_PAY.PAYOUT,
            //     payloadIsmart,
            //   );

            // this.logger.info(
            //   `Payout processed for order: ${order.orderId}`,
            //   response,
            // );

            if (!response.status) {
              throw new Error(response.message);
            }

            const status = convertExternalPaymentStatusToInternal(
              response.data.status.toUpperCase(),
            );

            await this.payOutOrdersRepository.save(
              this.payOutOrdersRepository.create({
                id: order.id,
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

                utr: response.data.utr,
              }),
            );

            if (status === PAYMENT_STATUS.FAILED) {
              throw new Error(response.message || "Payout failed");
            }

            if (user?.payOutWebhookUrl) {
              const payOutOrder = await this.payOutOrdersRepository.findOne({
                where: { id: order.id },
              });

              // this.logger.info(
              //   `Payout webhook payOutOrder: ${LoggerPlaceHolder.Json}`,
              //   payOutOrder,
              // );
              const payload = {
                orderId: order.orderId,
                status,
                amount: order.amount,
                txnRefId: payOutOrder.transferId,
                payoutId: payOutOrder.payoutId,
                utr: payOutOrder.utr,
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
              error,
            );

            const { amount, orderId, payoutId } = order;

            // this.logger.info(
            //   `Payout failed for order: ${order.orderId} : ${LoggerPlaceHolder.Json}`,
            //   order,
            // );

            if (user?.payOutWebhookUrl) {
              const payload = {
                orderId,
                status: PAYMENT_STATUS.FAILED,
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
                    `Payout webhook sent successfully - ${order.orderId} - ${user.payOutWebhookUrl} - RES: ${JSON.stringify(data)}`,
                  );
                })
                .catch((error) => {
                  this.logger.error(
                    `Payout webhook failed for order: ${order.orderId} : ${LoggerPlaceHolder.Json}`,
                    error,
                  );
                });
            }

            if (user?.payOutWebhookUrl) {
              const payload = {
                orderId,
                status: PAYMENT_STATUS.FAILED,
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

            if (wallet) {
              await this.walletRepository.save(
                this.walletRepository.create({
                  id: wallet.id,
                  availablePayoutBalance:
                    +wallet.availablePayoutBalance + +amount,
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
