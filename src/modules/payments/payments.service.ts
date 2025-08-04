import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import axios from "axios";
import { InjectRepository } from "@nestjs/typeorm";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import {
  Between,
  DataSource,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  QueryRunner,
  Repository,
} from "typeorm";
import { Queue } from "bull";
import { InjectQueue } from "@nestjs/bull";
import * as dayjs from "dayjs";
import {
  CreatePayinTransactionFlaPayDto,
  CreatePayinTransactionIsmartDto,
  PayinStatusDto,
} from "./dto/create-payin-payment.dto";
import {
  CreatePayoutDto,
  PayoutStatusDto,
  SinglePayoutDto,
} from "./dto/create-payout-payment.dto";
import {
  ExternalPayOutWebhookFlakPayDto,
  ExternalPayoutWebhookIsmartDto,
  PayoutWebhookResponseDto,
} from "./dto/external-webhook-payout.dto";
import {
  ExternalPayinWebhookFlakPayDto,
  ExternalPayinWebhookIsmartDto,
  ExternalPayinWebhookUtkarshDto,
} from "./dto/external-webhook-payin.dto";
import { TransactionsEntity } from "@/entities/transaction.entity";
import {
  MessageResponseDto,
  PaginationWithDateAndStatusDto,
  PaginationWithDateDto,
} from "@/dtos/common.dto";
import {
  PAYMENT_STATUS,
  PAYMENT_TYPE,
  PAYOUT_PAYMENT_MODE,
} from "@/enums/payment.enum";
import { UsersEntity } from "@/entities/user.entity";
import { CheckoutDto } from "@/modules/payments/dto/checkout.dto";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";
import { AxiosService } from "@/shared/axios/axios.service";
import { appConfig } from "@/config/app.config";
import {
  convertExternalPaymentStatusToInternal,
  getUlidId,
} from "@/utils/helperFunctions.utils";
import {
  DIASPAY,
  ERTITECH,
  FALKPAY,
  ISMART_PAY,
  SABPAISA,
  UTKARSH,
} from "@/constants/external-api.constant";
import { WalletEntity } from "@/entities/wallet.entity";
import {
  calculateOriginalAmountFromNetPayable,
  calculatePayoutOriginalAmountFromNetPayable,
  getCommissions,
  calculateDynamicCommission,
} from "@/utils/commissions.utils";
import {
  IExternalPayinPaymentRequestFlakPay,
  IExternalPayinPaymentRequestIsmart,
  IExternalPayinPaymentResponseFlakPay,
  IExternalPayinPaymentResponseIsmart,
  IExternalPayoutResponseFlakPay,
  IExternalPayoutStatusResponseFlakPay,
  IExternalEritecPayoutFundResponse,
  IExternalPayinStatusResponseUtkarsh,
  IExternalDiasPayFundResponse,
} from "@/interface/external-api.interface";
import { SettlementsEntity } from "@/entities/settlements.entity";
import { getPagination } from "@/utils/pagination.utils";
import { ID_TYPE, USERS_ROLE } from "@/enums";
import { REDIS_KEYS } from "@/constants/redis-cache.constant";
import {
  getDiaspayConfig,
  getEritechPgConfig,
  getFlakPayPgConfig,
  getIsmartPayPgConfig,
  getUtkarshPgConfig,
} from "@/utils/pg-config.utils";
import { ApiCredentialsEntity } from "@/entities/api-credentials.entity";
import { decryptData } from "@/utils/encode-decode.utils";
import { CryptoService } from "@/utils/encryption-algo.utils";
import { ThirdPartyAuthService } from "@/shared/third-party-auth/third-party-auth.service";
import { mapToFilteredDto } from "@/utils/interface-mapping.utils";
import customerUniqueGenerate from "@/utils/customer-unique.utils";
import { CheckoutEntity } from "@/entities/checkout.entity";
import { generatePaymentLinkUtil } from "@/utils/payment-link.util";
import { UtkarshCryptoService } from "@/utils/utkarsh-enc-decr.utils";

const {
  beBaseUrl,
  externalPaymentConfig,
  utkarsh: { vpa, utkarshMid, utkarshTerminalId },
} = appConfig();

@Injectable()
export class PaymentsService {
  private readonly logger = new CustomLogger(PaymentsService.name);

  constructor(
    @InjectRepository(TransactionsEntity)
    private readonly transactionsRepository: Repository<TransactionsEntity>,
    @InjectRepository(PayInOrdersEntity)
    private readonly payInOrdersRepository: Repository<PayInOrdersEntity>,
    @InjectRepository(PayOutOrdersEntity)
    private readonly payOutOrdersRepository: Repository<PayOutOrdersEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
    @InjectRepository(SettlementsEntity)
    private readonly settlementRepository: Repository<SettlementsEntity>,
    @InjectRepository(ApiCredentialsEntity)
    private readonly apiCredentialsRepository: Repository<ApiCredentialsEntity>,
    @InjectRepository(CheckoutEntity)
    private readonly checkoutRepository: Repository<CheckoutEntity>,
    @InjectQueue("payouts") private payoutQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,

    private readonly dataSource: DataSource,
    private readonly thirdPartyAuthService: ThirdPartyAuthService,
    private readonly encryptionAlgoService: CryptoService,
  ) {}
  public randomStr(len: number, arr: string) {
    let ans = "";
    for (let i = 0; i < len; i++) {
      ans += arr[Math.floor(Math.random() * arr.length)];
    }

    return ans;
  }

  async checkout(checkoutDto: CheckoutDto) {
    const clientTxnId = this.randomStr(10, "0123456789");
    const callbackUrl = `${beBaseUrl}/api/v1/payments/webhook/checkout`;
    const transDate = new Date();

    const {
      payerName,
      payerEmail,
      payerMobile,
      payerAddress,
      amount,
      channelId,
    } = checkoutDto;
    const {
      sabpaisa: {
        clientCode,
        transUserName,
        transUserPassword,
        mcc,
        Class,
        role,
      },
    } = appConfig();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. check if checkout order already exists
      const existingOrder = await this.checkoutRepository.exists({
        where: { clientTxnId },
      });
      if (existingOrder) {
        throw new BadRequestException(
          "Checkout order already exists for given clientTxnId",
        );
      }

      // 1. create checkout order
      const checkoutOrder = this.checkoutRepository.create({
        payerName,
        payerEmail,
        payerMobile,
        payerAddress,
        amount,
        clientTxnId,
        status: PAYMENT_STATUS.PENDING,
      });

      // 2. save checkout order
      const savedCheckoutOrder = await queryRunner.manager.save(checkoutOrder);
      this.logger.info(
        `Checkout order created: ${LoggerPlaceHolder.Json}`,
        savedCheckoutOrder,
      );

      // 3. create transaction
      const stringRequest =
        `payerName=${payerName}&payerEmail=${payerEmail}&payerMobile=${payerMobile}` +
        `&clientTxnId=${clientTxnId}&payerAddress=${payerAddress}&amount=${amount}` +
        `&clientCode=${clientCode}&transUserName=${transUserName}&transUserPassword=${transUserPassword}` +
        `&callbackUrl=${callbackUrl}&mcc=${mcc}&channelId=${channelId}` +
        `&transDate=${transDate}&Class=${Class}&role=${role}`;

      const url = SABPAISA.BASE_URL;
      const encryptedString = this.encryptionAlgoService.encrypt(stringRequest);

      this.logger.info(
        `Checkout - encryptedString: ${LoggerPlaceHolder.Json}`,
        encryptedString,
      );

      await queryRunner.commitTransaction();

      // Return the data directly for the controller/template
      return {
        spURL: url,
        encData: encryptedString,
        clientCode,
      };
    } catch (error) {
      this.logger.error("Error in checkout:", error);
      throw error;
    }
  }

  async checkPayOutWalletFlakPay(user: UsersEntity) {
    const wallet = await this.walletRepository.findOne({
      where: { user: { id: user.id } },
      select: {
        id: true,
        availablePayoutBalance: true,
        user: {
          id: true,
          fullName: true,
        },
      },
      relations: {
        user: true,
      },
    });

    return wallet;
  }

  async createTransactionPayinIsmart(
    createPayinTransactionDto: CreatePayinTransactionIsmartDto,
    user: UsersEntity,
  ) {
    const axiosServiceIsmart = new AxiosService(
      ISMART_PAY.BASE_URL,
      getIsmartPayPgConfig({
        clientId: externalPaymentConfig.ismart.clientId,
        clientSecret: externalPaymentConfig.ismart.clientSecret,
      }),
    );

    const { amount, email, mobile, name, orderId, vpa } =
      createPayinTransactionDto;
    const queryRunner = this.dataSource.createQueryRunner();

    const existingPayinOrder = await this.payInOrdersRepository.exists({
      where: { orderId },
    });

    if (existingPayinOrder) {
      throw new BadRequestException(
        "Payin order already exists for given orderId",
      );
    }

    // Start transaction
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingOrder = await this.payInOrdersRepository.exists({
        where: {
          orderId: createPayinTransactionDto.orderId,
        },
      });

      if (existingOrder) {
        throw new BadRequestException(
          new MessageResponseDto(
            "Payin Order id already exists. Please with different order id.",
          ),
        );
      }
      const { commissionAmount, gstAmount, netPayableAmount } = getCommissions({
        amount,
        commissionInPercentage: user.commissionInPercentagePayin,
        gstInPercentage: user.gstInPercentagePayin,
      });

      const wallet = await this.walletRepository.findOne({
        where: {
          user: {
            id: user.id,
          },
        },
        relations: {
          user: true,
        },
      });

      if (!wallet) {
        await queryRunner.manager.save(
          this.walletRepository.create({
            user,
          }),
        );
      }

      // 1. create pay-in order
      const payinOrder = this.payInOrdersRepository.create({
        user,
        amount,
        email,
        name,
        mobile,
        orderId,
        commissionAmount,
        gstAmount,
        netPayableAmount,
      });

      // 2. save pay-in order
      const savedPayinOrder = await queryRunner.manager.save(payinOrder);

      // 3. create transaction
      const transaction = this.transactionsRepository.create({
        user,
        payInOrder: savedPayinOrder,
        transactionType: PAYMENT_TYPE.PAYIN,
      });

      // 4. save transaction
      const savedTransaction = await queryRunner.manager.save(transaction);

      // this.logger.info(
      //   `PAYIN - createTransaction - transaction: ${LoggerPlaceHolder.Json}`,
      //   savedTransaction,
      // );

      const frontendUrl = `https://dash.${new URL(beBaseUrl).host.replace("api.", "")}`;
      const webhook_url = `${beBaseUrl}/api/v1/payments/payin/webhook`;
      // 5. create external payment
      const payload: IExternalPayinPaymentRequestIsmart = {
        amount: createPayinTransactionDto.amount.toFixed(2),
        currency: "INR",
        email: createPayinTransactionDto.email,
        mobile: createPayinTransactionDto.mobile,
        name: createPayinTransactionDto.name,
        order_id: createPayinTransactionDto.orderId,
        redirect_url: frontendUrl,
        ...(!!vpa && { pay_type: "UPI", vpa }),
        webhook_url,
      };

      // this.logger.info(
      //   `PAYIN - calling external (${ISMART_PAY.PAYIN}) API with payload: ${LoggerPlaceHolder.Json}`,
      //   payload,
      // );

      let externalPaymentResponse:
        | IExternalPayinPaymentResponseIsmart
        | undefined;
      try {
        externalPaymentResponse =
          await axiosServiceIsmart.postRequest<IExternalPayinPaymentResponseIsmart>(
            ISMART_PAY.PAYIN,
            payload,
          );

        // this.logger.info(
        //   `PAYIN - createTransaction - externalPaymentResponse: ${LoggerPlaceHolder.Json}`,
        //   externalPaymentResponse,
        // );
      } catch (error: any) {
        this.logger.error(
          `PAYIN - createTransaction - Got error while creating transaction - err: ${LoggerPlaceHolder.Json}`,
          error,
        );
        throw new BadRequestException(error.message);
      }

      if (!externalPaymentResponse) {
        throw new BadRequestException(
          externalPaymentResponse?.errors || "Something went wrong",
        );
      }

      if (!externalPaymentResponse.status) {
        throw new BadRequestException(
          externalPaymentResponse?.errors || "Something went wrong",
        );
      }

      const internalStatus = convertExternalPaymentStatusToInternal(
        externalPaymentResponse.status_code,
      );

      // try {
      //   const response = await axios.get(externalPaymentResponse?.payment_url, {
      //     maxRedirects: 5,
      //     validateStatus: (status) => status >= 200 && status < 400,
      //   });
      //   this.logger.info(
      //     `PAYIN - createTransaction - response: ${LoggerPlaceHolder.Json}`,
      //     response,
      //   );
      //   paymentLink = response.headers["location"];
      //   const response2 = await axios.get(paymentLink, {
      //     maxRedirects: 5,
      //     validateStatus: (status) => status >= 200 && status < 400,
      //   });
      //   this.logger.info(
      //     `PAYIN - createTransaction - response2: ${LoggerPlaceHolder.Json}`,
      //     response2,
      //   );
      //   const $ = cheerio.load(response2.data);
      //   this.logger.info(
      //     `PAYIN - createTransaction HTML- $: ${LoggerPlaceHolder.Json}`,
      //     $,
      //   );
      //   paytmIntent = $("#paytmform").attr("action");
      //   phonepeIntent = $("#phonepeform").attr("action");
      //   googlepayIntent = $("#gpay2form").attr("action");
      //   intent = $("#bhim2form").attr("action");
      // } catch (error: any) {
      //   this.logger.error(
      //     `PAYIN - createTransaction - Got error while creating transaction - err: ${LoggerPlaceHolder.Json}`,
      //     error,
      //   );
      //   paymentLink = externalPaymentResponse?.payment_url;
      // }

      // 6. save external payment
      const savedOrder = await queryRunner.manager.save(
        this.payInOrdersRepository.create({
          ...savedPayinOrder,
          ...(externalPaymentResponse?.intent && {
            intent: externalPaymentResponse?.intent,
          }),
          status: internalStatus,
          txnRefId: externalPaymentResponse.transaction_id,
          paymentLink: externalPaymentResponse?.payment_url,
        }),
      );

      // const paymentLink = getCheckoutUrl(savedOrder.id);

      await this.cacheManager.set(
        REDIS_KEYS.PAYMENT_STATUS(savedOrder.orderId),
        PAYMENT_STATUS.PENDING,
      );

      await queryRunner.commitTransaction();

      return {
        orderId: createPayinTransactionDto.orderId,
        message: !!vpa
          ? "Payment Request Sent Successfully"
          : "Payment Created Successfully",
        ...(externalPaymentResponse?.intent && {
          intent: externalPaymentResponse?.intent,
        }),
        // paymentLink: externalPaymentResponse?.payment_url,
      };

      // Commit transaction
    } catch (err: any) {
      this.logger.error(
        `PAYIN - createTransaction - Got error while creating transaction - err: ${LoggerPlaceHolder.Json}`,
        err,
      );
      // Rollback transaction if any operation fails
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err.message);
    } finally {
      // Release the queryRunner to avoid memory leaks
      await queryRunner.release();
    }
  }

  private async getFlakPayCredentials(userId: string) {
    const credentials = await this.apiCredentialsRepository.findOne({
      where: { user: { id: userId } },
      relations: { user: true },
    });
    if (!credentials) {
      throw new BadRequestException("Credentials not found");
    }

    const decryptedCredentials = await decryptData(credentials.credentials);
    const { clientId, clientSecret } = JSON.parse(decryptedCredentials);

    if (
      !clientId ||
      !clientSecret ||
      typeof clientId !== "string" ||
      typeof clientSecret !== "string"
    ) {
      throw new BadRequestException("Invalid credentials");
    }

    return { clientId, clientSecret };
  }

  async createTransactionPayinFlakPay(
    createPayinTransactionDto: CreatePayinTransactionFlaPayDto,
    user: UsersEntity,
  ) {
    const { clientId, clientSecret } = await this.getFlakPayCredentials(
      user.id,
    );

    const axiosServiceFlakPay = new AxiosService(
      FALKPAY.BASE_URL,
      getFlakPayPgConfig({
        clientId,
        clientSecret,
      }),
    );

    const { amount, email, mobile, name, orderId } = createPayinTransactionDto;

    const existingPayinOrder = await this.payInOrdersRepository.exists({
      where: { orderId },
    });

    if (existingPayinOrder) {
      throw new BadRequestException(
        "Payin order already exists for given orderId",
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();

    // Start transaction
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { commissionAmount, gstAmount, netPayableAmount } = getCommissions({
        amount,
        commissionInPercentage: user.commissionInPercentagePayin,
        gstInPercentage: user.gstInPercentagePayin,
      });
      // 1. create pay-in order
      const payinOrder = this.payInOrdersRepository.create({
        user,
        amount,
        email,
        name,
        mobile,
        commissionAmount,
        gstAmount,
        netPayableAmount,
        orderId,
      });

      // 2. save pay-in order
      const savedPayinOrder = await queryRunner.manager.save(payinOrder);

      // 3. create transaction
      const transaction = this.transactionsRepository.create({
        user,
        payInOrder: savedPayinOrder,
        transactionType: PAYMENT_TYPE.PAYIN,
      });

      // 4. save transaction
      await queryRunner.manager.save(transaction);

      // this.logger.info(
      //   `PAYIN - createTransaction - transaction: ${LoggerPlaceHolder.Json}`,
      //   savedTransaction,
      // );

      const [firstName, lastName = " "] =
        createPayinTransactionDto.name.split(" ");

      const frontendUrl = `https://dash.${new URL(beBaseUrl).host.replace("api.", "")}`;

      // 5. create external payment
      const payload: IExternalPayinPaymentRequestFlakPay = {
        amount: +createPayinTransactionDto.amount.toFixed(2),
        email: createPayinTransactionDto.email,
        phone: createPayinTransactionDto.mobile,
        firstName,
        lastName,
        orderId,
        pgReturnSuccessUrl: frontendUrl,
        pgReturnErrorUrl: frontendUrl,
      };

      // this.logger.info(
      //   `PAYIN - calling external (${FALKPAY.BASE_URL}${FALKPAY.PAYIN.LIVE}) API with payload: ${LoggerPlaceHolder.Json}`,
      //   payload,
      // );

      const externalPaymentResponse =
        await axiosServiceFlakPay.postRequest<IExternalPayinPaymentResponseFlakPay>(
          FALKPAY.PAYIN.LIVE,
          payload,
        );

      // this.logger.info(
      //   `PAYIN - createTransaction - externalPaymentResponse: ${LoggerPlaceHolder.Json}`,
      //   externalPaymentResponse,
      // );

      if (!externalPaymentResponse) {
        throw new BadRequestException(
          new MessageResponseDto("Something went wrong"),
        );
      }

      if (!externalPaymentResponse.success) {
        this.logger.error(
          `PAYIN - createTransaction - ERROR: ${externalPaymentResponse?.statusCode} ${externalPaymentResponse?.message}`,
        );
        throw new BadRequestException(
          externalPaymentResponse.message || "Something went wrong",
        );
      }

      // 6. save external payment
      await queryRunner.manager.save(
        this.payInOrdersRepository.create({
          ...savedPayinOrder,
          ...(externalPaymentResponse?.data?.paymentUrl && {
            intent: externalPaymentResponse?.data?.paymentUrl,
          }),
          txnRefId: externalPaymentResponse.data.txnRefId,
        }),
      );

      if (!externalPaymentResponse?.data?.paymentUrl?.trim()) {
        throw new BadRequestException(
          new MessageResponseDto("Something went wrong"),
        );
      }

      // this.logger.info(
      //   `PAYIN - createTransaction - Created transaction successfully`,
      // );

      // Commit transaction
      await queryRunner.commitTransaction();

      this.logger.info(
        `PAYIN CREATED: ${LoggerPlaceHolder.Json}`,
        createPayinTransactionDto,
      );

      return {
        orderId: externalPaymentResponse?.data?.orderId,
        ...(externalPaymentResponse?.data?.paymentUrl && {
          intent: externalPaymentResponse?.data?.paymentUrl,
        }),
        message: "Payin created successfully",
      };
    } catch (err: any) {
      this.logger.error(
        `PAYIN - createTransaction - Got error while creating transaction - err: ${LoggerPlaceHolder.Json}`,
        err,
      );
      // Rollback transaction if any operation fails
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err.message);
    } finally {
      // Release the queryRunner to avoid memory leaks
      await queryRunner.release();
    }
  }

  async createPayoutFlakPayBulk(
    createPayoutDto: CreatePayoutDto,
    user: UsersEntity,
  ) {
    const { data: payoutDataArr } = createPayoutDto;

    if (payoutDataArr.length > 1000) {
      throw new BadRequestException("Maximum 1000 payouts allowed");
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const totalAmount = payoutDataArr.reduce((acc, curr) => {
        if (curr.amount <= 0) {
          throw new BadRequestException("Amount should be greater than 0");
        }
        const commissionResult = calculateDynamicCommission({
          amount: +curr.amount,
          userCommissionRate: user.commissionInPercentagePayout,
          userGstRate: user.gstInPercentagePayout,
        });

        return acc + commissionResult.netPayableAmount;
      }, 0);

      // Check and update wallet balance
      await this.validateAndUpdateWallet(queryRunner, user, totalAmount);

      // Create batch job identifier
      const batchId = getUlidId(ID_TYPE.PAYOUT_BATCH_KEY);

      // Create payout orders in DB
      const payoutOrders = await this.createPayoutOrders(
        queryRunner,
        payoutDataArr,
        user,
        batchId,
      );

      // Add to processing queue
      await this.payoutQueue.add("process-payouts", {
        payoutOrders,
        userId: user.id,
        batchId,
      });

      await queryRunner.commitTransaction();

      this.logger.info(
        `PAYOUT CREATED: ${LoggerPlaceHolder.Json}`,
        createPayoutDto,
      );

      return {
        message: "Payout process initiated",
        batchId,
        payoutOrders: payoutOrders.map((payout) => ({
          orderId: payout.orderId,
          payoutId: payout.payoutId,
          amount: payout.amount,
          status: payout.status,
          accountNumber: payout.bankAccountNumber,
          bankName: payout.bankName,
          ifscCode: payout.bankIfsc,
        })),
        summary: {
          total: payoutDataArr.length,
          status: "PROCESSING",
        },
      };
    } catch (err) {
      this.logger.error(
        `PAYOUT - createTransaction - Error initiating payouts`,
        err,
      );
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async createPayoutDiasPay(
    createPayoutDto: CreatePayoutDto,
    user: UsersEntity,
  ) {
    const { data: payoutDataArr } = createPayoutDto;

    if (payoutDataArr.length > 1000) {
      throw new BadRequestException("Maximum 1000 payouts allowed");
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const totalAmount = payoutDataArr.reduce((acc, curr) => {
        if (curr.amount <= 0) {
          throw new BadRequestException("Amount should be greater than 0");
        }
        const commissionResult = calculateDynamicCommission({
          amount: +curr.amount,
          userCommissionRate: user.commissionInPercentagePayout,
          userGstRate: user.gstInPercentagePayout,
        });

        return acc + commissionResult.netPayableAmount;
      }, 0);

      // Check and update wallet balance
      await this.validateAndUpdateWallet(queryRunner, user, totalAmount);

      // Create batch job identifier
      const batchId = getUlidId(ID_TYPE.PAYOUT_BATCH_KEY);

      // Create payout orders in DB
      const payoutOrders = await this.createPayoutOrders(
        queryRunner,
        payoutDataArr,
        user,
        batchId,
      );

      // Add to processing queue
      await this.payoutQueue.add("process-payouts-dias-pay", {
        payoutOrders,
        userId: user.id,
        batchId,
      });

      await queryRunner.commitTransaction();

      this.logger.info(
        `PAYOUT CREATED: ${LoggerPlaceHolder.Json}`,
        createPayoutDto,
      );

      return {
        message: "Payout process initiated",
        batchId,
        payoutOrders: payoutOrders.map((payout) => ({
          orderId: payout.orderId,
          payoutId: payout.payoutId,
          amount: payout.amount,
          status: payout.status,
          accountNumber: payout.bankAccountNumber,
          bankName: payout.bankName,
          ifscCode: payout.bankIfsc,
        })),
        summary: {
          total: payoutDataArr.length,
          status: "PROCESSING",
        },
      };
    } catch (err) {
      this.logger.error(
        `PAYOUT - createTransaction - Error initiating payouts`,
        err,
      );
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async createPayoutFlakPaySingle(
    singlePayoutDto: SinglePayoutDto,
    user: UsersEntity,
  ) {
    if (singlePayoutDto.payoutId) {
      const payoutOrder = await this.payOutOrdersRepository.findOne({
        where: { payoutId: singlePayoutDto.payoutId },
      });

      if (payoutOrder) {
        throw new ConflictException("Payout order already exists");
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      // Check and update wallet balance
      await this.validateAndUpdateWallet(
        queryRunner,
        user,
        singlePayoutDto.amount,
      );
      this.logger.info(
        `Payout amount: ${singlePayoutDto.amount}`,
        user.flatCommission,
      );

      // Calculate dynamic commission for this payout
      const commissionResult = calculateDynamicCommission({
        amount: +singlePayoutDto.amount,
        userCommissionRate: +user.commissionInPercentagePayout,
        userGstRate: +user.gstInPercentagePayout,
      });

      const payoutOrder = this.payOutOrdersRepository.create({
        amount: +singlePayoutDto.amount,
        amountBeforeDeduction: commissionResult.netPayableAmount,
        transferMode: singlePayoutDto.paymentMode || PAYOUT_PAYMENT_MODE.IMPS,
        orderId: getUlidId(ID_TYPE.MERCHANT_PAYOUT),
        user,
        commissionInPercentage: commissionResult.commissionRate,
        gstInPercentage: commissionResult.gstRate,
        name: singlePayoutDto.beneficiaryName,
        bankAccountNumber: singlePayoutDto.accountNumber,
        bankIfsc: singlePayoutDto.ifscCode,
        bankName: singlePayoutDto.bankName,
        remarks: singlePayoutDto.remarks,
        purpose: singlePayoutDto.purpose,
        payoutId: singlePayoutDto.payoutId,
      });

      // this.logger.info(
      //   `PAYOUT - createTransaction - Created payout order successfully: ${savedPayoutOrder.orderId}, ${LoggerPlaceHolder.Json}`,
      //   savedPayoutOrder,
      // );

      // Call API

      const { clientId, clientSecret } = externalPaymentConfig.flakPay;

      const axiosServiceFlakPay = new AxiosService(
        FALKPAY.BASE_URL,
        getFlakPayPgConfig({
          clientId,
          clientSecret,
        }),
      );

      const payloadFlakPay = {
        amount: singlePayoutDto.amount,
        orderId: payoutOrder.orderId,
        transferMode: payoutOrder.transferMode,
        beneDetails: {
          beneBankName: payoutOrder.bankName,
          beneAccountNo: payoutOrder.bankAccountNumber,
          beneIfsc: payoutOrder.bankIfsc,
          beneName: payoutOrder.name,
        },
      };

      const response =
        await axiosServiceFlakPay.postRequest<IExternalPayoutResponseFlakPay>(
          FALKPAY.PAYOUT.LIVE,
          payloadFlakPay,
        );

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

      const savedPayoutOrder = await this.payOutOrdersRepository.save(
        this.payOutOrdersRepository.create({
          ...payoutOrder,
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
      // 3. create transaction
      const transaction = this.transactionsRepository.create({
        user,
        payOutOrder: savedPayoutOrder,
        transactionType: PAYMENT_TYPE.PAYOUT,
      });

      // 4. save transaction
      await queryRunner.manager.save(transaction);

      if (status === PAYMENT_STATUS.FAILED) {
        throw new Error(response.message || "Payout failed");
      }

      if (user?.payOutWebhookUrl) {
        const payOutOrder = await this.payOutOrdersRepository.findOne({
          where: { id: savedPayoutOrder.id },
        });

        // this.logger.info(
        //   `Payout webhook payOutOrder: ${LoggerPlaceHolder.Json}`,
        //   payOutOrder,
        // );
        const payload = {
          orderId: savedPayoutOrder.orderId,
          status,
          amount: savedPayoutOrder.amountBeforeDeduction,
          txnRefId: response.data.transferId,
          payoutId: savedPayoutOrder.payoutId,
          utr: response.data.utr,
        };

        this.logger.info(
          `Payout webhook payload: ${LoggerPlaceHolder.Json}`,
          payload,
        );
        axios
          .post(user.payOutWebhookUrl, payload)
          .then(({ data }) => {
            this.logger.info(
              `Payout webhook sent successfully - ${user.payOutWebhookUrl} - ${savedPayoutOrder.orderId} RES: ${JSON.stringify(data)}`,
            );
          })
          .catch((error) => {
            this.logger.error(
              `Payout webhook failed for order: ${savedPayoutOrder.orderId} : ${LoggerPlaceHolder.Json}`,
              error,
            );
          });
      }

      // this.logger.info(
      //   `Payout processed successfully: ${order.orderId} : ${LoggerPlaceHolder.Json}`,
      //   response.data,
      // );

      await queryRunner.commitTransaction();

      return {
        message: "Payout process initiated",
        payoutOrder: {
          orderId: savedPayoutOrder.orderId,
          payoutId: singlePayoutDto.payoutId,
          amount: singlePayoutDto.amount,
          status,
          accountNumber: savedPayoutOrder.bankAccountNumber,
          bankName: savedPayoutOrder.bankName,
          ifscCode: savedPayoutOrder.bankIfsc,
        },
      };
    } catch (err) {
      this.logger.error(
        `PAYOUT - createTransaction - Error initiating payouts`,
        err,
      );
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  // Eritech single fund transfer payout
  async createPayoutEritechSingle(
    singlePayoutDto: SinglePayoutDto,
    user: UsersEntity,
  ) {
    if (singlePayoutDto.payoutId) {
      const payoutOrder = await this.payOutOrdersRepository.findOne({
        where: { payoutId: singlePayoutDto.payoutId },
      });

      if (payoutOrder) {
        throw new ConflictException("Payout order already exists");
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      // Check and update wallet balance
      await this.validateAndUpdateWallet(
        queryRunner,
        user,
        singlePayoutDto.amount,
      );
      this.logger.info(
        `Payout amount: ${singlePayoutDto.amount}`,
        user.flatCommission,
      );
      const settlementAmount = calculatePayoutOriginalAmountFromNetPayable({
        netPayableAmount: +singlePayoutDto.amount,
        commissionInPercentage: +user.commissionInPercentagePayout,
        gstInPercentage: +user.gstInPercentagePayout,
        flatCommission: +user.flatCommission,
      });

      const payoutOrder = this.payOutOrdersRepository.create({
        amount: +singlePayoutDto.amount,
        amountBeforeDeduction: settlementAmount,
        transferMode: singlePayoutDto.paymentMode || PAYOUT_PAYMENT_MODE.IMPS,
        orderId: getUlidId(ID_TYPE.MERCHANT_PAYOUT),
        user,
        commissionInPercentage: +user.commissionInPercentagePayout,
        gstInPercentage: +user.gstInPercentagePayout,
        name: singlePayoutDto.beneficiaryName,
        bankAccountNumber: singlePayoutDto.accountNumber,
        bankIfsc: singlePayoutDto.ifscCode,
        bankName: singlePayoutDto.bankName,
        remarks: singlePayoutDto.remarks,
        purpose: singlePayoutDto.purpose,
        payoutId: singlePayoutDto.payoutId,
      });

      this.logger.info(
        `PAYOUT - createTransaction - Created payout order successfully: ${payoutOrder.orderId}, ${LoggerPlaceHolder.Json}`,
        payoutOrder,
      );

      // Call API

      // Get authentication token from ThirdPartyAuthService
      const token = await this.thirdPartyAuthService.getEritechToken();

      const axiosErtech = new AxiosService(
        ERTITECH.BASE_URL,
        getEritechPgConfig({
          token,
          merchantId: externalPaymentConfig.ertech.merchantId,
        }),
      );

      const customerUniqueRef = payoutOrder.orderId.split("_").join("");

      const eriTechPayload = {
        paymentDetails: {
          txnPaymode: payoutOrder.transferMode,
          txnAmount: payoutOrder.amount,
          beneIfscCode: payoutOrder.bankIfsc,
          beneAccNum: payoutOrder.bankAccountNumber,
          beneName: payoutOrder.name,
          custUniqRef: customerUniqueRef,
          beneMobileNo: user.mobile,
          preferredBank: "ind",
        },
      };

      // this.logger.info(
      //   "eriTechPayload",
      // this.logger.info(
      //   "eriTechPayload",
      //   `${LoggerPlaceHolder.Json}`,
      //   eriTechPayload,
      // );

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
        throw new Error(responseEritech.message);
      }

      this.logger.info(
        `Fund transfer Eritech Response: ${LoggerPlaceHolder.Json}`,
        responseEritech,
      );

      const eriTechDecryptedResponse =
        await this.thirdPartyAuthService.getDecryptedPayload(
          responseEritech.data.encryptedResponseData,
          token,
        );

      this.logger.info(
        `Ertitech Response: ${LoggerPlaceHolder.Json}`,
        eriTechDecryptedResponse,
      );

      if (!responseEritech.success) {
        throw new Error(responseEritech.errors);
      }
      this.logger.info(
        `Payout processed for order: ${payoutOrder.orderId}`,
        responseEritech.message,
      );

      const status = convertExternalPaymentStatusToInternal(
        eriTechDecryptedResponse.txn_status.transactionStatus.toUpperCase(),
      );

      const savedPayoutOrder = await this.payOutOrdersRepository.save(
        this.payOutOrdersRepository.create({
          ...payoutOrder,
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

          utr: eriTechDecryptedResponse.utrNo,
        }),
      );
      // 3. create transaction
      const transaction = this.transactionsRepository.create({
        user,
        payOutOrder: savedPayoutOrder,
        transactionType: PAYMENT_TYPE.PAYOUT,
      });

      // 4. save transaction
      await queryRunner.manager.save(transaction);

      if (status === PAYMENT_STATUS.FAILED) {
        throw new Error(responseEritech.message || "Payout failed");
      }

      if (user?.payOutWebhookUrl) {
        const payOutOrder = await this.payOutOrdersRepository.findOne({
          where: { id: savedPayoutOrder.id },
        });

        this.logger.info(
          `Payout webhook payOutOrder: ${LoggerPlaceHolder.Json}`,
          payOutOrder,
        );
        const payload = {
          orderId: savedPayoutOrder.orderId,
          status,
          amount: savedPayoutOrder.amountBeforeDeduction,
          txnRefId: eriTechDecryptedResponse.custUniqRef,
          payoutId: savedPayoutOrder.payoutId,
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
              `Payout webhook sent successfully - ${user.payOutWebhookUrl} - ${savedPayoutOrder.orderId} RES: ${JSON.stringify(data)}`,
            );
          })
          .catch((error) => {
            this.logger.error(
              `Payout webhook failed for order: ${savedPayoutOrder.orderId} : ${LoggerPlaceHolder.Json}`,
              error,
            );
          });
      }

      this.logger.info(
        `Payout processed successfully: ${savedPayoutOrder.orderId} : ${LoggerPlaceHolder.Json}`,
        eriTechDecryptedResponse,
      );

      await queryRunner.commitTransaction();

      return {
        message: "Payout process initiated",
        payoutOrder: {
          orderId: savedPayoutOrder.orderId,
          payoutId: singlePayoutDto.payoutId,
          amount: singlePayoutDto.amount,
          status,
          accountNumber: savedPayoutOrder.bankAccountNumber,
          bankName: savedPayoutOrder.bankName,
          ifscCode: savedPayoutOrder.bankIfsc,
        },
      };
    } catch (err) {
      this.logger.error(
        `PAYOUT - createTransaction - Error initiating payouts`,
        err,
      );
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async createPayoutIsmart(
    createPayoutDto: CreatePayoutDto,
    user: UsersEntity,
  ) {
    const { data: payoutDataArr } = createPayoutDto;

    if (payoutDataArr.length > 1000) {
      throw new BadRequestException("Maximum 1000 payouts allowed");
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Validate amounts and calculate total
      const totalAmount = payoutDataArr.reduce((acc, curr) => {
        if (curr.amount <= 0) {
          throw new BadRequestException("Amount should be greater than 0");
        }

        return acc + +curr.amount;
      }, 0);

      // Check and update wallet balance
      const walletAfterDeduction = await this.validateAndUpdateWallet(
        queryRunner,
        user,
        totalAmount,
      );

      // Create batch job identifier
      const batchId = getUlidId(ID_TYPE.PAYOUT_BATCH_KEY);

      // Create payout orders in DB
      const payoutOrders = await this.createPayoutOrders(
        queryRunner,
        payoutDataArr,
        user,
        batchId,
      );

      // Add to processing queue
      await this.payoutQueue.add("process-payouts", {
        payoutOrders,
        userId: user.id,
        batchId,
      });

      await queryRunner.commitTransaction();

      return {
        message: "Payout process initiated",
        batchId,
        payoutOrders: payoutOrders.map((payout) => ({
          orderId: payout.orderId,
          name: payout.name,
          amount: payout.amount,
          status: payout.status,
          accountNumber: payout.bankAccountNumber,
          bankName: payout.bankName,
          ifscCode: payout.bankIfsc,
        })),
        summary: {
          total: payoutDataArr.length,
          status: "PROCESSING",
        },
      };
    } catch (err) {
      this.logger.error(
        `PAYOUT - createTransaction - Error initiating payouts`,
        err,
      );
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  private async validateAndUpdateWallet(
    queryRunner: QueryRunner,
    user: UsersEntity,
    totalAmount: number,
  ) {
    let userWallet = await queryRunner.manager
      .createQueryBuilder(WalletEntity, "wallet")
      .setLock("pessimistic_write")
      .leftJoinAndSelect("wallet.user", "user")
      .where("user.id = :userId", { userId: user.id })
      .getOne();

    if (!userWallet) {
      userWallet = await queryRunner.manager.save(
        this.walletRepository.create({ user }),
      );
    }

    const currentBalance = +userWallet.availablePayoutBalance;
    const newBalance = currentBalance - totalAmount;
    const MINIMUM_BALANCE = 10000;

    if (newBalance < 0) {
      throw new BadRequestException(
        `Insufficient balance. Required: ${totalAmount}, Available: ${currentBalance}`,
      );
    }

    if (newBalance < MINIMUM_BALANCE) {
      throw new BadRequestException(
        `Minimum balance of ₹${MINIMUM_BALANCE} must be maintained. After this transaction, balance would be ₹${newBalance}`,
      );
    }

    this.logger.info(
      `PAYOUT - validateAndUpdateWallet - User wallet update: ${LoggerPlaceHolder.Json}`,
      {
        userId: user.id,
        currentBalance,
        totalAmount,
        newBalance,
        userFullName: user.fullName,
      },
    );

    userWallet.availablePayoutBalance = newBalance;
    const updatedWallet = await queryRunner.manager.save(userWallet);

    this.logger.info(
      `PAYOUT - validateAndUpdateWallet - Wallet updated successfully: ${LoggerPlaceHolder.Json}`,
      {
        walletId: updatedWallet.id,
        newBalance: updatedWallet.availablePayoutBalance,
      },
    );

    return updatedWallet;
  }

  private async createPayoutOrders(
    queryRunner: QueryRunner,
    payouts: SinglePayoutDto[], // data
    user: UsersEntity,
    batchId: string,
  ) {
    return Promise.all(
      payouts.map(async (payment) => {
        // Calculate dynamic commission for this payout
        const commissionResult = calculateDynamicCommission({
          amount: +payment.amount,
          userCommissionRate: +user.commissionInPercentagePayout,
          userGstRate: +user.gstInPercentagePayout,
        });

        this.logger.info(
          `PAYOUT - createPayoutOrders - Dynamic commission result: ${LoggerPlaceHolder.Json}`,
          {
            originalAmount: payment.amount,
            netPayableAmount: commissionResult.netPayableAmount,
          },
        );

        const payoutOrder = this.payOutOrdersRepository.create({
          amount: +payment.amount,
          amountBeforeDeduction: +commissionResult.netPayableAmount,
          transferMode: payment.paymentMode || PAYOUT_PAYMENT_MODE.IMPS,
          orderId: getUlidId(ID_TYPE.MERCHANT_PAYOUT),
          batchId,
          user,
          commissionInPercentage:
            +payment.amount <= 1000 ? 7 : +user.commissionInPercentagePayout,
          gstInPercentage: +user.gstInPercentagePayout,
          name: payment.beneficiaryName,
          bankAccountNumber: payment.accountNumber,
          beneficiaryMobile: payment.beneficiaryMobile,
          bankIfsc: payment.ifscCode,
          bankName: payment.bankName,
          remarks: payment.remarks,
          purpose: payment.purpose,
          payoutId: payment.payoutId,
        });

        const savedPayoutOrder = await queryRunner.manager.save(payoutOrder);

        // 3. create transaction
        const transaction = this.transactionsRepository.create({
          user,
          payOutOrder: savedPayoutOrder,
          transactionType: PAYMENT_TYPE.PAYOUT,
        });

        // 4. save transaction
        await queryRunner.manager.save(transaction);

        return savedPayoutOrder;
      }),
    );
  }

  async checkPayInStatusTransaction(
    { orderId }: PayinStatusDto,
    user: UsersEntity,
  ) {
    this.logger.debug(`Utkarsh checkPayInStatusTransaction: ${orderId}`);

    const payinOrder = await this.payInOrdersRepository.findOne({
      where: { orderId },
    });

    if (!payinOrder) {
      throw new NotFoundException(
        new MessageResponseDto("Payin order not found"),
      );
    }

    // Only skip API call if status is already SUCCESS and we have a txnRefId
    // This prevents unnecessary API calls for completed transactions
    if (payinOrder.status === PAYMENT_STATUS.SUCCESS && payinOrder.txnRefId) {
      this.logger.info(
        `Transaction already completed: ${orderId}, returning cached status`,
      );

      return {
        orderId: payinOrder.orderId,
        status: payinOrder.status,
        txnRefId: payinOrder.txnRefId,
      };
    }

    const formattedDate = dayjs(payinOrder.createdAt).format("YYYY-MM-DD");

    const utkarshCryptoService = new UtkarshCryptoService();

    const encryptedData = utkarshCryptoService.encrypt(
      JSON.stringify({
        merchantOrderNumber: orderId,
        transactionDate: formattedDate,
      }),
    );

    const axiosServiceUtkarsh = new AxiosService(
      UTKARSH.BASE_URL,
      getUtkarshPgConfig({
        mid: utkarshMid,
        terminalId: utkarshTerminalId,
      }),
    );

    const utkarshPayload = {
      mid: utkarshMid,
      req: encryptedData,
      terminalId: utkarshTerminalId,
    };

    const utkarshResponse =
      await axiosServiceUtkarsh.postRequest<IExternalPayinStatusResponseUtkarsh>(
        UTKARSH.PAYIN.STATUS_CHECK,
        JSON.stringify(utkarshPayload),
      );

    const { data: utkarshRaw } = utkarshResponse;

    if (!utkarshRaw || typeof utkarshRaw !== "string") {
      this.logger.error(`UTKARSH API failed: ${JSON.stringify(utkarshRaw)}`);
      throw new Error(
        "Invalid or missing encrypted hex string in UTKARSH response",
      );
    }

    // ✅ Only decrypt when everything is valid
    const decryptedJson = utkarshCryptoService.decrypt(utkarshRaw);
    this.logger.info(
      `Utkarsh  json decrypted data: ${JSON.stringify({ decryptedJson })}`,
    );

    const { status: utkarshStatus, transactionId } = JSON.parse(decryptedJson);

    this.logger.info(
      `Utkarsh transactionId: ${transactionId}, status: ${utkarshStatus}`,
    );

    const status = convertExternalPaymentStatusToInternal(
      utkarshStatus.toUpperCase(),
    );

    const payInOrder = await this.payInOrdersRepository.save(
      this.payInOrdersRepository.create({
        ...payinOrder,
        status,
        txnRefId: transactionId,
      }),
    );
    if (user?.payInWebhookUrl) {
      const payload = {
        orderId: payInOrder.orderId,
        status,
        amount: +payInOrder.amount,
        txnRefId: transactionId,
        utr: payInOrder.utr,
      };
      this.logger.info(
        `Payin webhook for ${payInOrder.orderId} PAYLOAD : ${LoggerPlaceHolder.Json}`,
        payload,
      );
      axios
        .post(user.payInWebhookUrl, payload)
        .then((res) => {
          this.logger.info(
            `Payin webhook sent successfully: ${payInOrder.orderId} - Status: ${res.status}`,
            res,
          );
        })
        .catch((error) => {
          this.logger.error(
            `Payin webhook failed for order: ${payInOrder.orderId} - Status: ${error.status}`,
            error,
          );
        });
    }

    return {
      orderId: payinOrder.orderId,
      status,
      txnRefId: transactionId,
    };
  }

  // dias pay status check
  async checkPayOutStatusTransactionDiasPay(
    { orderId }: PayoutStatusDto,
    user: UsersEntity,
  ) {
    const payoutOrder = await this.payOutOrdersRepository.findOne({
      where: { orderId },
    });

    if (!payoutOrder) {
      throw new NotFoundException(
        new MessageResponseDto("Payout order not found"),
      );
    }

    if (payoutOrder.status !== PAYMENT_STATUS.PENDING) {
      return {
        orderId: payoutOrder.orderId,
        status: payoutOrder.status,
        transferId: payoutOrder.transferId,
      };
    }

    // call api
    const axiosServiceDiasPay = new AxiosService(
      DIASPAY.BASE_URL,
      getDiaspayConfig({
        token: externalPaymentConfig.diaspay.token,
      }),
    );

    const diasPayResponse =
      await axiosServiceDiasPay.postRequest<IExternalDiasPayFundResponse>(
        DIASPAY.PAYOUT.QUERY,
        {
          order_id: orderId,
        },
      );

    this.logger.info(
      `Dias Pay Response: ${LoggerPlaceHolder.Json}`,
      diasPayResponse,
    );

    // update payout order
    const status = convertExternalPaymentStatusToInternal(
      diasPayResponse.status.toUpperCase(),
    );

    await this.payOutOrdersRepository.save(
      this.payOutOrdersRepository.create({
        ...payoutOrder,
        status,
        transferId: diasPayResponse.UTR,
      }),
    );

    return {
      orderId: payoutOrder.orderId,
      status,
      transferId: diasPayResponse.UTR,
    };
  }
  // flakpay status check
  async checkPayOutStatusTransactionFlakPay({ orderId }: PayoutStatusDto) {
    const payoutOrder = await this.payOutOrdersRepository.findOne({
      where: { orderId },
    });

    if (!payoutOrder) {
      throw new NotFoundException(
        new MessageResponseDto("Payout order not found"),
      );
    }

    if (payoutOrder.status !== PAYMENT_STATUS.PENDING) {
      return {
        orderId: payoutOrder.orderId,
        status: payoutOrder.status,
        transferId: payoutOrder.transferId,
      };
    }

    // call api
    const { clientId, clientSecret } = await this.getFlakPayCredentials(
      payoutOrder.user.id,
    );

    const axiosServiceFlakPay = new AxiosService(
      FALKPAY.BASE_URL,
      getFlakPayPgConfig({
        clientId,
        clientSecret,
      }),
    );

    const flakPayResponse =
      await axiosServiceFlakPay.postRequest<IExternalPayoutStatusResponseFlakPay>(
        FALKPAY.PAYOUT.STATUS_CHECK,
        {
          orderId,
        },
      );

    // update payout order

    const status = convertExternalPaymentStatusToInternal(
      flakPayResponse.data.status.toUpperCase(),
    );

    await this.payOutOrdersRepository.save(
      this.payOutOrdersRepository.create({
        ...payoutOrder,
        status,
        transferId: flakPayResponse.data.transferId,
      }),
    );

    return {
      orderId: payoutOrder.orderId,
      status,
      transferId: flakPayResponse.data.transferId,
    };
  }

  async findAllTransactions() {
    return this.transactionsRepository.find();
  }

  async findTransaction(id: string) {
    return this.transactionsRepository.findOne({ where: { id } });
  }

  // Ismart
  async externalWebhookPayinIsmart(
    externalPayinWebhookDto: ExternalPayinWebhookIsmartDto,
  ) {
    const {
      order_id: orderId,
      status_code,
      transaction_id: txnRefId,
    } = externalPayinWebhookDto;

    const status = convertExternalPaymentStatusToInternal(status_code);

    const payinOrder = await this.payInOrdersRepository.findOne({
      where: {
        orderId,
      },
      relations: ["user"],
    });

    if (!payinOrder) {
      throw new NotFoundException(
        new MessageResponseDto("Payin order not found"),
      );
    }

    if (status === payinOrder.status) {
      this.logger.info(
        `PAYIN WEBHOOK - Duplicate webhook of order: ${payinOrder.orderId}`,
      );

      return new MessageResponseDto("Status updated successfully.");
    }

    const { user } = payinOrder;

    const payinOrderRaw = this.payInOrdersRepository.create({
      id: payinOrder.id,
      status,
      txnRefId,
      ...(status === PAYMENT_STATUS.SUCCESS && {
        successAt: new Date(),
      }),
      ...(status === PAYMENT_STATUS.FAILED && {
        failureAt: new Date(),
      }),
    });

    await this.payInOrdersRepository.save(payinOrderRaw);

    // update wallet
    if (status === PAYMENT_STATUS.SUCCESS) {
      const wallet = await this.walletRepository.findOne({
        where: { user: { id: user.id } },
        relations: ["user"],
      });

      await this.cacheManager.del(
        REDIS_KEYS.PAYMENT_STATUS(payinOrder.orderId),
      );

      const walletRaw = this.walletRepository.create({
        ...(wallet?.id && { id: wallet.id }),
        totalCollections:
          (wallet.totalCollections ? +wallet.totalCollections : 0) +
          +payinOrder.amount,
        user,
      });

      await this.walletRepository.save(walletRaw);

      this.logger.info(
        `PAYIN WEBHOOK - externalWebhookUpdateStatusPayin - wallet updated successfully ${user.fullName}: ${LoggerPlaceHolder.Json}`,
        walletRaw,
      );
    }

    if (user?.payInWebhookUrl) {
      const webhookPayload = {
        orderId,
        status,
        amount: payinOrder.amount,
        txnRefId: payinOrder.txnRefId, // utr
      };
      this.logger.info(
        `PAYIN - Going to call user PAYIN WEBHOOK (${user?.payInWebhookUrl}) with payload: ${LoggerPlaceHolder.Json}`,
        webhookPayload,
      );
      axios
        .post(user.payInWebhookUrl, webhookPayload, {
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then(() => {
          this.logger.info(
            `PAYIN - User webhook (${user?.payInWebhookUrl}) sent successfully: ${LoggerPlaceHolder.Json}`,
            user,
          );
        })
        .catch((err) => {
          this.logger.error(
            `PAYIN - externalPayinWebhookUpdateStatus - error while sending webhook to user: ${LoggerPlaceHolder.Json}`,
            err,
          );
        });
    }

    return new MessageResponseDto("Transaction status updated successfully.");
  }

  // FlakPay
  async externalWebhookPayinFlakPay(
    externalPayinWebhookDto: ExternalPayinWebhookFlakPayDto,
  ) {
    const {
      orderId,
      status: status_code,
      transactionRefId: txnRefId,
      utr,
    } = externalPayinWebhookDto;

    let status = convertExternalPaymentStatusToInternal(status_code);

    const payinOrder = await this.payInOrdersRepository.findOne({
      where: {
        orderId,
      },
      relations: ["user"],
    });

    if (!payinOrder) {
      throw new NotFoundException(
        new MessageResponseDto("Payin order not found"),
      );
    }

    if (status === payinOrder.status) {
      this.logger.info(
        `PAYIN WEBHOOK - Duplicate webhook of order: ${payinOrder.orderId}`,
      );

      return {
        message: "Status updated successfully.",
        timestamp: new Date().toISOString(),
      };
    }

    // Jumping Start

    let successCount =
      +(await this.cacheManager.get(
        REDIS_KEYS.SUCCESS_COUNT(payinOrder.user.id),
      )) || 1;

    let isMisspelled = false;
    const { jumpingCount } = payinOrder.user;

    if (status === PAYMENT_STATUS.SUCCESS && jumpingCount > 0) {
      if (successCount >= jumpingCount) {
        const statusArr = [
          PAYMENT_STATUS.PENDING,
          PAYMENT_STATUS.DEEMED,
          PAYMENT_STATUS.INITIATED,
          PAYMENT_STATUS.FAILED,
        ];
        status = statusArr[Math.floor(Math.random() * statusArr.length)];
        successCount = 0;
        isMisspelled = true;
      } else {
        successCount += 1;
      }

      await this.cacheManager.set(
        REDIS_KEYS.SUCCESS_COUNT(payinOrder.user.id),
        successCount,
        1000 * 60 * 60 * 24 * 365, // 365 days
      );
    }

    // Jumpind End

    const { user } = payinOrder;

    const payinOrderRaw = this.payInOrdersRepository.create({
      id: payinOrder.id,
      status,
      txnRefId,
      ...(!isMisspelled && { utr }),
      isMisspelled,
      ...(status === PAYMENT_STATUS.SUCCESS && {
        successAt: new Date(),
      }),
      ...(status === PAYMENT_STATUS.FAILED && {
        failureAt: new Date(),
      }),
    });

    await this.payInOrdersRepository.save(payinOrderRaw);

    // update wallet
    if (status === PAYMENT_STATUS.SUCCESS) {
      const wallet = await this.walletRepository.findOne({
        where: { user: { id: user.id } },
        relations: ["user"],
      });

      await this.cacheManager.del(
        REDIS_KEYS.PAYMENT_STATUS(payinOrder.orderId),
      );

      const walletRaw = this.walletRepository.create({
        ...(wallet?.id && { id: wallet.id }),
        totalCollections:
          (wallet.totalCollections ? +wallet.totalCollections : 0) +
          +payinOrder.amount,
        user,
      });

      await this.walletRepository.save(walletRaw);

      // this.logger.info(
      //   `PAYIN WEBHOOK - externalWebhookUpdateStatusPayin - wallet updated successfully ${user.fullName}: ${LoggerPlaceHolder.Json}`,
      //   walletRaw,
      // );
    }

    if (user?.payInWebhookUrl) {
      const webhookPayload = {
        orderId,
        status,
        amount: payinOrder.amount,
        txnRefId: payinOrder.txnRefId,
        ...(!isMisspelled && { utr }),
      };
      // this.logger.info(
      //   `PAYIN - Going to call user PAYIN WEBHOOK (${user?.payInWebhookUrl}) with payload: ${LoggerPlaceHolder.Json}`,
      //   webhookPayload,
      // );
      axios
        .post(user.payInWebhookUrl, webhookPayload, {
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then(({ data }) => {
          this.logger.info(
            `PAYIN - User webhook (${user?.payInWebhookUrl}) sent successfully RES: ${JSON.stringify(data)}`,
          );
        })
        .catch((err) => {
          this.logger.error(
            `PAYIN - externalPayinWebhookUpdateStatus - error while sending webhook to user: ${LoggerPlaceHolder.Json}`,
            err,
          );
        });
    }

    return {
      message: "Transaction status updated successfully.",
      timestamp: new Date().toISOString(),
    };
  }

  // FlakPay
  async webhookRequestUs({
    orderId,
    status,
    utr,
  }: {
    status: PAYMENT_STATUS;
    orderId: string;
    utr?: string;
  }) {
    const payinOrder = await this.payInOrdersRepository.findOne({
      where: {
        orderId,
      },
      relations: ["user"],
    });

    if (!payinOrder) {
      throw new NotFoundException(
        new MessageResponseDto("Payin order not found"),
      );
    }

    if (status === payinOrder.status) {
      this.logger.info(
        `REQUEST US WEBHOOK - Duplicate webhook of order: ${payinOrder.orderId}`,
      );
      const { user } = payinOrder;
      if (user?.payInWebhookUrl) {
        const webhookPayload = {
          orderId,
          status,
          amount: payinOrder.amount,
          txnRefId: payinOrder.txnRefId,
          utr: utr ? utr : payinOrder.utr,
        };
        this.logger.info(
          `REQUEST US WEBHOOK - PAYIN - Going to call user PAYIN WEBHOOK (${user?.payInWebhookUrl}) with payload: ${LoggerPlaceHolder.Json}`,
          webhookPayload,
        );
        axios
          .post(user.payInWebhookUrl, webhookPayload, {
            headers: {
              "Content-Type": "application/json",
            },
          })
          .then(() => {
            this.logger.info(
              `REQUEST US WEBHOOK - PAYIN - User webhook (${user?.payInWebhookUrl}) sent successfully: ${LoggerPlaceHolder.Json}`,
              user,
            );
          })
          .catch((err) => {
            this.logger.error(
              `REQUEST US WEBHOOK - PAYIN - webhookRequestUs - error while sending webhook to user: ${LoggerPlaceHolder.Json}`,
              err,
            );
          });
      }

      return {
        message: "Status updated successfully.",
        timestamp: new Date().toISOString(),
      };
    }

    const { user } = payinOrder;

    const payinOrderRaw = this.payInOrdersRepository.create({
      id: payinOrder.id,
      status,
      ...(utr && { utr }),
      isMisspelled: false,
      ...(status === PAYMENT_STATUS.SUCCESS && {
        successAt: new Date(),
      }),
      ...(status === PAYMENT_STATUS.FAILED && {
        failureAt: new Date(),
      }),
    });

    await this.payInOrdersRepository.save(payinOrderRaw);

    // update wallet
    if (status === PAYMENT_STATUS.SUCCESS) {
      const wallet = await this.walletRepository.findOne({
        where: { user: { id: user.id } },
        relations: ["user"],
      });

      await this.cacheManager.del(
        REDIS_KEYS.PAYMENT_STATUS(payinOrder.orderId),
      );

      const walletRaw = this.walletRepository.create({
        ...(wallet?.id && { id: wallet.id }),
        totalCollections:
          (wallet.totalCollections ? +wallet.totalCollections : 0) +
          +payinOrder.amount,

        user,
      });

      await this.walletRepository.save(walletRaw);

      // this.logger.info(
      //   `REQUEST US WEBHOOK - webhookRequestUs - wallet updated successfully ${user.fullName}: ${LoggerPlaceHolder.Json}`,
      //   walletRaw,
      // );
    }

    if (user?.payInWebhookUrl) {
      const webhookPayload = {
        orderId,
        status,
        amount: payinOrder.amount,
        txnRefId: payinOrder.txnRefId,
        utr: utr ? utr : payinOrder.utr,
      };
      this.logger.info(
        `REQUEST US WEBHOOK - PAYIN - Going to call user PAYIN WEBHOOK (${user?.payInWebhookUrl}) with payload: ${LoggerPlaceHolder.Json}`,
        webhookPayload,
      );
      axios
        .post(user.payInWebhookUrl, webhookPayload, {
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then(() => {
          this.logger.info(
            `REQUEST US WEBHOOK - PAYIN - User webhook (${user?.payInWebhookUrl}) sent successfully: ${LoggerPlaceHolder.Json}`,
            user,
          );
        })
        .catch((err) => {
          this.logger.error(
            `REQUEST US WEBHOOK - PAYIN - webhookRequestUs - error while sending webhook to user: ${LoggerPlaceHolder.Json}`,
            err,
          );
        });
    }

    return {
      message: "Transaction status updated successfully.",
      timestamp: new Date().toISOString(),
    };
  }

  async externalWebhookPayoutFlaPay({
    status: status_code,
    orderId: order_id,
    transferId: transaction_id,
    amount,
    utr,
  }: ExternalPayOutWebhookFlakPayDto) {
    const status = convertExternalPaymentStatusToInternal(
      status_code.toUpperCase(),
    );

    // this.logger.info(`WEBHOOK: data: ${LoggerPlaceHolder.Json}`, {
    //   STATUS: status_code,
    //   PAYOUT_REF: order_id,
    //   TXN_ID: transaction_id,
    //   AMOUNT: amount,
    //   utr,
    // });

    const [idPrefix] = order_id.split("_");

    const isSettlement = idPrefix === ID_TYPE.SETTLEMENT_PAYOUT;

    if (isSettlement) {
      const settlement = await this.settlementRepository.findOne({
        where: {
          id: order_id,
        },
        relations: {
          user: true,
        },
      });

      if (!settlement) {
        throw new BadRequestException(
          new MessageResponseDto("No Settlement Found"),
        );
      }

      if (settlement.status === status) {
        // this.logger.info(
        //   `SETTLEMENT WEBHOOK: Duplicate webhook of order: ${settlement.id}`,
        // );

        return {
          message: `Duplicate Webhook for PAYOUT/SETTLEMENT : ${order_id}`,
          timestamp: new Date().toISOString(),
        };
      }

      if (status === PAYMENT_STATUS.SUCCESS) {
        const settlementRaw = this.settlementRepository.create({
          id: order_id,
          status,
          successAt: new Date(),
          transferId: transaction_id,
          utr,
        });

        await this.settlementRepository.save(settlementRaw);
      }

      if (status === PAYMENT_STATUS.FAILED) {
        const settlementRaw = this.settlementRepository.create({
          id: order_id,
          status,
          failureAt: new Date(),
          transferId: transaction_id,
          utr,
        });

        await this.settlementRepository.save(settlementRaw);

        const userId = settlement.user.id;

        const wallet = await this.walletRepository.findOne({
          where: {
            user: {
              id: userId,
            },
          },
          relations: {
            user: true,
          },
        });

        const collectionAmount = calculateOriginalAmountFromNetPayable({
          netPayableAmount: +amount,
          commissionInPercentage: +wallet.user.commissionInPercentagePayin,
          gstInPercentage: +wallet.user.gstInPercentagePayin,
        });

        const walletRaw = this.walletRepository.create({
          ...(wallet?.id && { id: wallet.id }),
          id: wallet.id,
          totalCollections: +wallet.totalCollections - collectionAmount,
          availablePayoutBalance:
            +wallet.availablePayoutBalance + collectionAmount,

          user: wallet.user,
        });

        await this.walletRepository.save(walletRaw);
      }

      return {
        message: "Transaction status updated successfully.",
        timestamp: new Date().toISOString(),
      };
    } else {
      const payOutOrder = await this.payOutOrdersRepository.findOne({
        where: {
          orderId: order_id,
        },
        relations: ["user"],
      });

      // this.logger.info(
      //   `PAYOUT WEBHOOK - For OrderId: ${order_id} :`,
      //   payOutOrder,
      // );

      if (!payOutOrder) {
        throw new NotFoundException(
          new MessageResponseDto("Payout order not found"),
        );
      }

      if (payOutOrder.status === status) {
        // this.logger.info(
        //   `PAYOUT WEBHOOK - Duplicate webhook of order: ${order_id}`,
        // );
        return {
          message: `Duplicate Webhook for PAYOUT/SETTLEMENT : ${order_id}`,
          timestamp: new Date().toISOString(),
        };
      }

      if (status === PAYMENT_STATUS.SUCCESS) {
        const payOutOrderRaw = this.payOutOrdersRepository.create({
          id: payOutOrder.id,
          status,
          successAt: new Date(),
          transferId: transaction_id,
          utr,
        });

        await this.payOutOrdersRepository.save(payOutOrderRaw);
      }

      if (status === PAYMENT_STATUS.FAILED) {
        const payOutOrderRaw = this.payOutOrdersRepository.create({
          id: payOutOrder.id,
          status,
          failureAt: new Date(),
          transferId: transaction_id,
          utr,
        });

        await this.payOutOrdersRepository.save(payOutOrderRaw);

        const wallet = await this.walletRepository.findOne({
          where: {
            user: {
              id: payOutOrder.user.id,
            },
          },
          relations: {
            user: true,
          },
        });

        await this.walletRepository.save(
          this.walletRepository.create({
            id: wallet.id,
            availablePayoutBalance: +wallet.availablePayoutBalance + +amount,
          }),
        );
      }

      // send webhook
      if (payOutOrder.user?.payOutWebhookUrl) {
        const webhookPayload = {
          orderId: order_id,
          status,
          amount,
          txnRefId: transaction_id,
          payoutId: payOutOrder.payoutId,
          utr,
        };

        this.logger.info(
          `Payout webhook payload: ${LoggerPlaceHolder.Json}`,
          webhookPayload,
        );

        axios
          .post(payOutOrder.user.payOutWebhookUrl, webhookPayload)
          .then(({ data }) => {
            this.logger.info(
              `PAYOUT - User webhook - (${payOutOrder.user.payOutWebhookUrl}) - ${payOutOrder.payoutId} - Webhook sent successfully: ${JSON.stringify(data)}`,
            );
          })
          .catch((err) => {
            this.logger.error(
              `PAYOUT - externalPayinWebhookUpdateStatus - error while sending webhook to user: ${LoggerPlaceHolder.Json}`,
              err,
            );
          });
      }

      return {
        message: "Payout status updated successfully.",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async externalWebhookPayoutEritech(
    rawWebhookData: any,
  ): Promise<PayoutWebhookResponseDto> {
    this.logger.info(
      `Raw Eritech Webhook Data: ${LoggerPlaceHolder.Json}`,
      rawWebhookData,
    );
    const webhookData = mapToFilteredDto(rawWebhookData);

    this.logger.info(
      `Eritech Webhook Data: ${LoggerPlaceHolder.Json}`,
      webhookData,
    );

    const {
      status: status_code,
      orderId: custUniqRef,
      // transferId: custUniqRef,
      amount,
      utr,
    } = webhookData;

    const status = convertExternalPaymentStatusToInternal(
      status_code.toUpperCase(),
    );

    // this.logger.info(`WEBHOOK: data: ${LoggerPlaceHolder.Json}`, {
    //   STATUS: status_code,
    //   PAYOUT_REF: order_id,
    //   TXN_ID: transaction_id,
    //   AMOUNT: amount,
    //   utr,
    // });

    const { order_id, isSettlement, isPayout } =
      customerUniqueGenerate(custUniqRef);

    if (isSettlement) {
      const settlement = await this.settlementRepository.findOne({
        where: {
          id: order_id,
        },
        relations: {
          user: true,
        },
      });

      if (!settlement) {
        throw new BadRequestException(
          new MessageResponseDto("No Settlement Found"),
        );
      }

      if (settlement.status === status) {
        // this.logger.info(
        //   `SETTLEMENT WEBHOOK: Duplicate webhook of order: ${settlement.id}`,
        // );

        return {
          message: `Duplicate Webhook for PAYOUT/SETTLEMENT : ${order_id}`,
          timestamp: new Date().toISOString(),
        };
      }

      if (status === PAYMENT_STATUS.SUCCESS) {
        const settlementRaw = this.settlementRepository.create({
          id: order_id,
          status,
          successAt: new Date(),
          transferId: custUniqRef,
          utr,
        });

        await this.settlementRepository.save(settlementRaw);
      }

      if (status === PAYMENT_STATUS.FAILED) {
        const settlementRaw = this.settlementRepository.create({
          id: order_id,
          status,
          failureAt: new Date(),
          transferId: custUniqRef,
          utr,
        });

        await this.settlementRepository.save(settlementRaw);

        const userId = settlement.user.id;

        const wallet = await this.walletRepository.findOne({
          where: {
            user: {
              id: userId,
            },
          },
          relations: {
            user: true,
          },
        });

        const collectionAmount = calculateOriginalAmountFromNetPayable({
          netPayableAmount: +amount,
          commissionInPercentage: +wallet.user.commissionInPercentagePayin,
          gstInPercentage: +wallet.user.gstInPercentagePayin,
        });

        const walletRaw = this.walletRepository.create({
          ...(wallet?.id && { id: wallet.id }),
          id: wallet.id,
          totalCollections: +wallet.totalCollections - collectionAmount,
          availablePayoutBalance:
            +wallet.availablePayoutBalance + collectionAmount,

          user: wallet.user,
        });

        await this.walletRepository.save(walletRaw);
      }

      return {
        message: "Transaction status updated successfully.",
        timestamp: new Date().toISOString(),
      };
    } else {
      const payOutOrder = await this.payOutOrdersRepository.findOne({
        where: {
          orderId: order_id,
        },
        relations: ["user"],
      });

      this.logger.info(
        `PAYOUT WEBHOOK - For OrderId: ${order_id} :`,
        payOutOrder,
      );

      if (!payOutOrder) {
        throw new NotFoundException(
          new MessageResponseDto("Payout order not found"),
        );
      }

      if (payOutOrder.status === status) {
        // this.logger.info(
        //   `PAYOUT WEBHOOK - Duplicate webhook of order: ${order_id}`,
        // );
        return {
          message: `Duplicate Webhook for PAYOUT/SETTLEMENT : ${order_id}`,
          timestamp: new Date().toISOString(),
        };
      }

      if (status === PAYMENT_STATUS.SUCCESS) {
        const payOutOrderRaw = this.payOutOrdersRepository.create({
          id: payOutOrder.id,
          status,
          successAt: new Date(),
          transferId: custUniqRef,
          utr,
        });

        this.logger.info(
          `PAYOUT - Eritech Webhook - ${payOutOrder.id} - Webhook received successfully: ${LoggerPlaceHolder.Json}`,
          payOutOrderRaw,
        );

        await this.payOutOrdersRepository.save(payOutOrderRaw);
      }

      if (status === PAYMENT_STATUS.FAILED) {
        const payOutOrderRaw = this.payOutOrdersRepository.create({
          id: payOutOrder.id,
          status,
          failureAt: new Date(),
          transferId: custUniqRef,
          utr,
        });

        await this.payOutOrdersRepository.save(payOutOrderRaw);

        // const wallet = await this.walletRepository.findOne({
        //   where: {
        //     user: {
        //       id: payOutOrder.user.id,
        //     },
        //   },
        //   relations: {
        //     user: true,
        //   },
        // });

        // await this.walletRepository.save(
        //   this.walletRepository.create({
        //     id: wallet.id,
        //     availablePayoutBalance: +wallet.availablePayoutBalance + +amount,
        //   }),
        // );
      }

      // send webhook
      if (payOutOrder.user?.payOutWebhookUrl) {
        const webhookPayload = {
          orderId: order_id,
          status,
          amount: payOutOrder.amount,
          txnRefId: custUniqRef,
          payoutId: payOutOrder.payoutId,
          utr,
        };

        this.logger.info(
          `Payout webhook payload: ${LoggerPlaceHolder.Json}`,
          webhookPayload,
        );

        axios
          .post(payOutOrder.user.payOutWebhookUrl, webhookPayload)
          .then(({ data }) => {
            this.logger.info(
              `PAYOUT - User webhook - (${payOutOrder.user.payOutWebhookUrl}) - ${payOutOrder.payoutId} - Webhook sent successfully: ${JSON.stringify(data)}`,
            );
          })
          .catch((err) => {
            this.logger.error(
              `PAYOUT - externalPayinWebhookUpdateStatus - error while sending webhook to user: ${LoggerPlaceHolder.Json}`,
              err,
            );
          });
      }

      return {
        message: "Payout status updated successfully.",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async externalWebhookPayoutIsmart({
    status_code,
    order_id,
    transaction_id,
    amount,
  }: ExternalPayoutWebhookIsmartDto) {
    const status = convertExternalPaymentStatusToInternal(
      status_code.toUpperCase(),
    );

    const [idPrefix] = order_id.split("_");

    const isSettlement = idPrefix === ID_TYPE.SETTLEMENT_PAYOUT;

    // for settlement payouts
    if (isSettlement) {
      const settlement = await this.settlementRepository.findOne({
        where: {
          id: order_id,
        },
        relations: {
          user: true,
        },
      });

      if (!settlement) {
        throw new BadRequestException(
          new MessageResponseDto("No Settlement Found"),
        );
      }

      if (settlement.status === status) {
        // this.logger.info(
        //   `SETTLEMENT WEBHOOK: Duplicate webhook of order: ${settlement.id}`,
        // );

        return new MessageResponseDto(
          `Duplicate Webhook for PAYOUT/SETTLEMENT : ${order_id}`,
        );
      }

      if (status === PAYMENT_STATUS.SUCCESS) {
        const settlementRaw = this.settlementRepository.create({
          id: order_id,
          status,
          successAt: new Date(),
          transferId: transaction_id,
        });

        await this.settlementRepository.save(settlementRaw);
      }

      if (status === PAYMENT_STATUS.FAILED) {
        const settlementRaw = this.settlementRepository.create({
          id: order_id,
          status,
          failureAt: new Date(),
          transferId: transaction_id,
        });

        await this.settlementRepository.save(settlementRaw);

        const userId = settlement.user.id;

        const wallet = await this.walletRepository.findOne({
          where: {
            user: {
              id: userId,
            },
          },
          relations: {
            user: true,
          },
        });

        const { commissionInPercentagePayin, gstInPercentagePayin } =
          wallet.user;

        const originalAmount = calculateOriginalAmountFromNetPayable({
          netPayableAmount: +amount,
          commissionInPercentage: +wallet.user.commissionInPercentagePayout,
          gstInPercentage: +wallet.user.gstInPercentagePayout,
        });

        const walletRaw = this.walletRepository.create({
          ...(wallet?.id && { id: wallet.id }),
          id: wallet.id,
          totalCollections: +wallet.totalCollections + originalAmount,
          user: wallet.user,
        });
        await this.walletRepository.save(walletRaw);
      }

      return new MessageResponseDto("Transaction status updated successfully.");
    } else {
      // for merchant payouts
      const payOutOrder = await this.payOutOrdersRepository.findOne({
        where: {
          orderId: order_id,
        },
        relations: ["user"],
      });

      if (!payOutOrder) {
        throw new NotFoundException(
          new MessageResponseDto("Payin order not found"),
        );
      }

      if (payOutOrder.status === status) {
        // this.logger.info(
        //   `PAYOUT WEBHOOK - Duplicate webhook of order: ${order_id}`,
        // );

        return new MessageResponseDto(
          `Duplicate Webhook for PAYOUT/SETTLEMENT : ${order_id}`,
        );
      }

      if (status === PAYMENT_STATUS.SUCCESS) {
        const payOutOrderRaw = this.payOutOrdersRepository.create({
          id: payOutOrder.id,
          status,
          successAt: new Date(),
          transferId: transaction_id,
        });

        await this.payOutOrdersRepository.save(payOutOrderRaw);
      }

      if (status === PAYMENT_STATUS.FAILED) {
        const payOutOrderRaw = this.payOutOrdersRepository.create({
          id: payOutOrder.id,
          status,
          failureAt: new Date(),
          transferId: transaction_id,
        });

        await this.payOutOrdersRepository.save(payOutOrderRaw);

        const wallet = await this.walletRepository.findOne({
          where: {
            user: {
              id: payOutOrder.user.id,
            },
          },
          relations: {
            user: true,
          },
        });

        const commissionRate = +wallet.user.commissionInPercentagePayout / 100;
        const gstRate =
          (commissionRate * +wallet.user.gstInPercentagePayout) / 100;

        const totalDeductionRate = commissionRate + gstRate;

        if (totalDeductionRate >= 1) {
          throw new BadRequestException(
            "Invalid rates: Total deduction cannot be equal or greater than 1.",
          );
        }

        // update wallet
        await this.walletRepository.save(
          this.walletRepository.create({
            id: wallet.id,
            availablePayoutBalance: +wallet.availablePayoutBalance + amount, // 600
          }),
        );
      }

      // send webhook
      if (payOutOrder.user.payOutWebhookUrl) {
        axios
          .post(payOutOrder.user.payOutWebhookUrl, {
            orderId: order_id,
            status,
            amount,
            txnRefId: transaction_id,
          })
          .then(() => {
            this.logger.info(
              `PAYOUT - User webhook (${payOutOrder.user.payOutWebhookUrl}) sent successfully: ${LoggerPlaceHolder.Json}`,
              payOutOrder,
            );
          })
          .catch((err) => {
            this.logger.error(
              `PAYOUT - externalPayinWebhookUpdateStatus - error while sending webhook to user: ${LoggerPlaceHolder.Json}`,
              err,
            );
          });
      }

      return new MessageResponseDto("Payout status updated successfully.");
    }
  }

  async getTransactionsDetails(
    user: UsersEntity,
    {
      limit = 10,
      page = 1,
      sort = "id",
      order = "DESC",
      search = "",
      startDate,
      endDate,
      status,
    }: PaginationWithDateAndStatusDto,
  ) {
    const whereQuery:
      | FindOptionsWhere<PayInOrdersEntity>
      | FindOptionsWhere<PayInOrdersEntity>[] = {};

    // Date Filter
    if (startDate && endDate) {
      whereQuery.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      whereQuery.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      whereQuery.createdAt = LessThanOrEqual(new Date(endDate));
    }
    const query = [];

    const internalStatus = status
      ? convertExternalPaymentStatusToInternal(status.toUpperCase())
      : undefined;

    if ([USERS_ROLE.ADMIN, USERS_ROLE.OWNER].includes(user.role)) {
      if (search) {
        const orderIdSearch = {
          orderId: ILike(`%${search}%`),
          ...(internalStatus && { status: internalStatus }),
        };

        const txnRefSearch = {
          txnRefId: ILike(`%${search}%`),
          ...(internalStatus && { status: internalStatus }),
        };

        const userIdSearch = {
          user: {
            id: ILike(`%${search}%`),
          },
          ...(internalStatus && { status: internalStatus }),
        };

        const nameSearch = {
          user: {
            fullName: ILike(`%${search}%`),
          },
          ...(internalStatus && { status: internalStatus }),
        };

        const emailSearch = {
          user: {
            email: ILike(`%${search}%`),
          },
          ...(internalStatus && { status: internalStatus }),
        };

        const mobileSearch = {
          user: {
            mobile: ILike(`%${search}%`),
          },
          ...(internalStatus && { status: internalStatus }),
        };

        query.push(orderIdSearch);
        query.push(txnRefSearch);
        query.push(nameSearch);
        query.push(emailSearch);
        query.push(mobileSearch);
        query.push(userIdSearch);
      }
    } else {
      if (search) {
        const userIdSearch = {
          user: {
            id: user.id,
          },
          ...(internalStatus && { status: internalStatus }),
        };

        const orderIdSearch = {
          user: {
            id: user.id,
          },
          orderId: ILike(`%${search}%`),
          ...(internalStatus && { status: internalStatus }),
        };

        const txnRefSearch = {
          user: {
            id: user.id,
          },
          txnRefId: ILike(`%${search}%`),
          ...(internalStatus && { status: internalStatus }),
        };

        const nameSearch = {
          user: {
            id: user.id,
            fullName: ILike(`%${search}%`),
          },
          ...(internalStatus && { status: internalStatus }),
        };

        const emailSearch = {
          user: {
            id: user.id,
            email: ILike(`%${search}%`),
          },
          ...(internalStatus && { status: internalStatus }),
        };

        const mobileSearch = {
          user: {
            id: user.id,
            mobile: ILike(`%${search}%`),
          },
          ...(internalStatus && { status: internalStatus }),
        };

        query.push(userIdSearch);
        query.push(orderIdSearch);
        query.push(txnRefSearch);
        query.push(nameSearch);
        query.push(emailSearch);
        query.push(mobileSearch);
      } else {
        query.push({
          user: {
            id: user.id,
          },
          ...(internalStatus && { status: internalStatus }),
        });
      }
    }

    if (internalStatus) {
      if (!query.length) {
        query.push({ status: internalStatus });
      }
    }

    const [data, totalItems] = await this.payInOrdersRepository.findAndCount({
      where: query,
      relations: {
        user: true,
      },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        txnRefId: true,
        orderId: true,
        intent: true,
        name: true,
        user: {
          id: true,
          fullName: true,
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      order: { [sort]: order },
    });

    const pagination = getPagination({
      totalItems,
      page,
      limit,
    });

    return {
      data,
      pagination,
    };
  }

  async getMisspelledPayinTransactions({
    page = 1,
    limit = 10,
    sort = "id",
    order = "DESC",
    search = "",
    startDate,
    endDate,
  }: PaginationWithDateDto) {
    try {
      const whereQuery: FindOptionsWhere<PayInOrdersEntity> = {};

      if (startDate && endDate) {
        whereQuery.createdAt = Between(new Date(startDate), new Date(endDate));
      } else if (startDate) {
        whereQuery.createdAt = MoreThanOrEqual(new Date(startDate));
      } else if (endDate) {
        whereQuery.createdAt = LessThanOrEqual(new Date(endDate));
      }

      const query = [
        {
          isMisspelled: true,
          ...(search && { orderId: ILike(`%${search}%`) }),
          ...whereQuery,
        },
        {
          isMisspelled: true,
          ...(search && { txnRefId: ILike(`%${search}%`) }),
          ...whereQuery,
        },
      ];

      const totalAmountPromise = await this.payInOrdersRepository
        .createQueryBuilder()
        .select("SUM(amount)", "total")
        .where(query)
        .getRawOne();

      const txnPromise = this.payInOrdersRepository.findAndCount({
        where: query,
        relations: {
          user: true,
        },
        select: {
          id: true,
          orderId: true,
          amount: true,
          status: true,
          txnRefId: true,
          createdAt: true,
          updatedAt: true,
          isMisspelled: true,
          user: {
            id: true,
            fullName: true,
            email: true,
            mobile: true,
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        order: { [sort]: order },
      });

      const [[transactions, totalItems], { total: totalAmount }] =
        await Promise.all([txnPromise, totalAmountPromise]);

      const pagination = getPagination({
        totalItems,
        page,
        limit,
      });

      // this.logger.info(
      //   `PAYIN - getMisspelledPayinTransactions - Found ${totalItems} misspelled transactions`,
      // );

      return {
        data: transactions.map((transaction) => ({
          ...transaction,
          amount: +transaction.amount, // Convert to number
        })),
        pagination,
        stats: {
          totalAmount: +totalAmount,
          totalCount: totalItems,
          paginatedAmount: transactions.reduce(
            (sum, tx) => +sum + +tx.amount,
            0,
          ),
        },
      };
    } catch (error) {
      this.logger.error(
        `PAYIN - getMisspelledPayinTransactions - Error: ${LoggerPlaceHolder.Json}`,
        error,
      );
      throw new BadRequestException(error.message);
    }
  }

  async handleCheckoutWebhookRawBody(body: string | object): Promise<void> {
    try {
      let parsedBody: any;
      if (typeof body === "string") {
        try {
          parsedBody = JSON.parse(body);
        } catch {
          const formData = new URLSearchParams(body);
          parsedBody = Object.fromEntries(formData.entries());
        }
      } else {
        parsedBody = body;
      }
      const encrypted =
        parsedBody.encResponse ||
        parsedBody.statusResponseData ||
        parsedBody.encData ||
        parsedBody.encryptedData ||
        parsedBody.data;
      if (!encrypted) {
        throw new Error("No encrypted data found in payload");
      }
      const decoded = decodeURIComponent(encrypted);
      let decryptedString: string;
      try {
        decryptedString = this.encryptionAlgoService.decrypt(decoded);
      } catch (err) {
        this.logger.error("[Webhook] Decryption failed:", err);
        throw new Error("Decryption failed: " + err.message);
      }
      let parsedDecrypted: any;
      try {
        const params = new URLSearchParams(decryptedString);
        parsedDecrypted = Object.fromEntries(params.entries());
      } catch (err) {
        throw new Error(
          "Decryption failed: Invalid form data in decrypted data",
        );
      }
      const clientTxnId =
        parsedDecrypted.clientTxnId ||
        parsedDecrypted.transactionId ||
        parsedDecrypted.orderId;
      if (!clientTxnId) {
        throw new Error("No clientTxnId found in decrypted data");
      }
      const checkout = await this.checkoutRepository.findOne({
        where: { clientTxnId },
      });
      if (!checkout) {
        throw new Error(`Checkout not found for clientTxnId: ${clientTxnId}`);
      }
      const { statusCode } = parsedDecrypted;

      this.logger.info(`[Webhook] Status code: ${statusCode}`);
      this.logger.info(`[Webhook] Status code: ${parsedDecrypted}`);

      let status = PAYMENT_STATUS.PENDING;
      switch (statusCode) {
        case "0000":
        case "SUCCESS":
          status = PAYMENT_STATUS.SUCCESS;
          break;
        case "0300":
        case "FAILED":
          status = PAYMENT_STATUS.FAILED;
          break;
        case "0100":
        case "INITIATED":
          status = PAYMENT_STATUS.INITIATED;
          break;
        case "0200":
        case "ABORTED":
          status = PAYMENT_STATUS.ABORTED;
          break;
        case "404":
        case "NOT_FOUND":
          status = PAYMENT_STATUS.NOT_FOUND;
          break;
        default:
          status = PAYMENT_STATUS.FAILED;
      }
      checkout.status = status;

      await this.checkoutRepository.save(checkout);
    } catch (error) {
      this.logger.error("[Webhook] Webhook processing failed:", error);
      throw error;
    }
  }
  async getCheckoutByClientTxnId(clientTxnId: string): Promise<CheckoutEntity> {
    try {
      const checkout = await this.checkoutRepository.findOne({
        where: { clientTxnId },
      });

      if (!checkout) {
        throw new NotFoundException(
          `Checkout not found for clientTxnId: ${clientTxnId}`,
        );
      }
      this.logger.info("Checkout entity:", JSON.stringify(checkout, null, 2));

      return checkout;
    } catch (error) {
      this.logger.error(
        `[Checkout] Error fetching checkout by clientTxnId: ${LoggerPlaceHolder.Json}`,
        error,
      );
      throw error;
    }
  }
  async createUtkarshPaymentLink(
    createPayinTransactionDto: CreatePayinTransactionFlaPayDto,
    user: UsersEntity,
  ) {
    const { amount, email, mobile, name, orderId } = createPayinTransactionDto;

    const existingPayinOrder = await this.payInOrdersRepository.exists({
      where: { orderId },
    });

    if (existingPayinOrder) {
      throw new BadRequestException(
        "Payin order already exists for given orderId",
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();

    // Start transaction
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { commissionAmount, gstAmount, netPayableAmount } = getCommissions({
        amount,
        commissionInPercentage: user.commissionInPercentagePayin,
        gstInPercentage: user.gstInPercentagePayin,
      });
      // 1. create pay-in order
      const payinOrder = this.payInOrdersRepository.create({
        user,
        amount,
        email,
        name,
        mobile,
        commissionAmount,
        gstAmount,
        netPayableAmount,
        orderId,
      });

      // 2. save pay-in order
      const savedPayinOrder = await queryRunner.manager.save(payinOrder);

      // 3. create transaction
      const transaction = this.transactionsRepository.create({
        user,
        payInOrder: savedPayinOrder,
        transactionType: PAYMENT_TYPE.PAYIN,
      });

      // 4. save transaction
      await queryRunner.manager.save(transaction);

      const paymentLink = generatePaymentLinkUtil({
        amount,
        orderId,
        vpa,
      });
      // 6. save external payment
      await queryRunner.manager.save(
        this.payInOrdersRepository.create({
          ...savedPayinOrder,
          ...(paymentLink && {
            intent: paymentLink,
          }),
        }),
      );

      // if (!externalPaymentResponse?.data?.paymentUrl?.trim()) {
      //   throw new BadRequestException(
      //     new MessageResponseDto("Something went wrong"),
      //   );
      // }

      // this.logger.info(
      //   `PAYIN - createTransaction - Created transaction successfully`,
      // );

      // Commit transaction
      await queryRunner.commitTransaction();

      this.logger.info(
        `PAYIN CREATED: ${LoggerPlaceHolder.Json}`,
        createPayinTransactionDto,
      );

      return {
        orderId,
        intent: paymentLink,
        message: "Payment Link Generated successfully",
      };
    } catch (err: any) {
      this.logger.error(
        `PAYIN - createTransaction - Got error while creating transaction - err: ${LoggerPlaceHolder.Json}`,
        err,
      );
      // Rollback transaction if any operation fails
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err.message);
    } finally {
      // Release the queryRunner to avoid memory leaks
      await queryRunner.release();
    }
  }

  // immediate fix by version check
  private async safeUpdateWalletBalance(
    queryRunner: QueryRunner,
    userId: string,
    updateFn: (wallet: WalletEntity) => void,
  ): Promise<WalletEntity> {
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Get wallet without lock
      const wallet = await queryRunner.manager
        .createQueryBuilder(WalletEntity, "wallet")
        .where("wallet.userId = :userId", { userId })
        .getOne();

      if (!wallet) {
        throw new NotFoundException(`Wallet not found for user: ${userId}`);
      }

      const originalVersion = wallet.version;
      updateFn(wallet);
      wallet.version = originalVersion + 1;

      try {
        // Update with version check
        const result = await queryRunner.manager
          .createQueryBuilder()
          .update(WalletEntity)
          .set({
            totalCollections: wallet.totalCollections,
            availablePayoutBalance: wallet.availablePayoutBalance,
            version: wallet.version,
            updatedAt: new Date(),
          })
          .where("userId = :userId AND version = :version", {
            userId,
            version: originalVersion,
          })
          .execute();

        if (result.affected === 0) {
          // Version conflict, retry
          if (attempt === maxRetries - 1) {
            throw new Error("Wallet update conflict after max retries");
          }
          await new Promise((resolve) =>
            setTimeout(resolve, 50 * (attempt + 1)),
          ); // Exponential backoff
          continue;
        }

        return wallet;
      } catch (error) {
        if (attempt === maxRetries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
      }
    }
  }

  // private async safeUpdateWalletBalance(
  //   queryRunner: QueryRunner,
  //   userId: string,
  //   updateFn: (wallet: WalletEntity) => void,
  // ): Promise<WalletEntity> {
  //   const wallet = await queryRunner.manager
  //     .createQueryBuilder(WalletEntity, "wallet")
  //     .setLock("pessimistic_write")
  //     .where("wallet.userId = :userId", { userId })
  //     .getOne();

  //   if (!wallet) {
  //     throw new NotFoundException(`Wallet not found for user: ${userId}`);
  //   }
  //   updateFn(wallet);

  //   return await queryRunner.manager.save(wallet);
  // }

  async externalWebhookPayinUtkarsh(
    externalWebhookPayin: ExternalPayinWebhookUtkarshDto,
  ) {
    try {
      const { txnId, txnStatus, custRef, amount, refId, uniqueId, upiTxnId } =
        externalWebhookPayin;

      let status = convertExternalPaymentStatusToInternal(txnStatus);

      const payinOrder = await this.payInOrdersRepository.findOne({
        where: {
          orderId: refId,
        },
        relations: ["user"],
      });

      this.logger.info(
        `PAYIN - Webhook called - Payin order: ${LoggerPlaceHolder.Json}`,
        payinOrder.id,
      );

      if (!payinOrder) {
        throw new NotFoundException(
          new MessageResponseDto("Payin order not found"),
        );
      }

      if (status === payinOrder.status) {
        // this.logger.info(
        //   `PAYIN WEBHOOK - Duplicate webhook of order: ${payinOrder.orderId}`,
        // );
        return {
          message: "Status updated successfully.",
          timestamp: new Date().toISOString(),
        };
      }

      // Jumping Start

      let successCount =
        +(await this.cacheManager.get(
          REDIS_KEYS.SUCCESS_COUNT(payinOrder.user.id),
        )) || 1;

      let isMisspelled = false;
      const { jumpingCount } = payinOrder.user;

      if (status === PAYMENT_STATUS.SUCCESS && jumpingCount > 0) {
        if (successCount >= jumpingCount) {
          const statusArr = [
            PAYMENT_STATUS.PENDING,
            PAYMENT_STATUS.DEEMED,
            PAYMENT_STATUS.INITIATED,
            PAYMENT_STATUS.FAILED,
          ];
          status = statusArr[Math.floor(Math.random() * statusArr.length)];
          successCount = 0;
          isMisspelled = true;
        } else {
          successCount += 1;
        }

        await this.cacheManager.set(
          REDIS_KEYS.SUCCESS_COUNT(payinOrder.user.id),
          successCount,
          1000 * 60 * 60 * 24 * 20, // 20 days
        );

        if (status === payinOrder.status) {
          this.logger.info(
            `PAYIN WEBHOOK - Duplicate webhook of order: ${payinOrder.orderId}`,
          );

          return {
            message: "Status updated successfully.",
            timestamp: new Date().toISOString(),
          };
        }
      }
      const { user } = payinOrder;

      const isAmountMismatch = +payinOrder.amount !== +amount;

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        let payinOrderRaw;
        if (isAmountMismatch) {
          const { commissionAmount, gstAmount, netPayableAmount } =
            getCommissions({
              amount,
              commissionInPercentage: user.commissionInPercentagePayin,
              gstInPercentage: user.gstInPercentagePayin,
            });

          payinOrderRaw = this.payInOrdersRepository.create({
            id: payinOrder.id,
            status,
            amount,
            commissionAmount,
            gstAmount,
            netPayableAmount,
            txnRefId: txnId,
            ...(isAmountMismatch && {
              status: PAYMENT_STATUS.MISMATCH,
            }),
            ...(!isMisspelled && { utr: custRef }),
            isMisspelled,
          });
        } else {
          payinOrderRaw = this.payInOrdersRepository.create({
            id: payinOrder.id,
            status,
            amount,
            txnRefId: txnId,
            ...(!isMisspelled && { utr: custRef }),
            isMisspelled,
            ...(status === PAYMENT_STATUS.SUCCESS && {
              successAt: new Date(),
            }),
            ...(status === PAYMENT_STATUS.FAILED && {
              failureAt: new Date(),
            }),
          });
        }

        await this.payInOrdersRepository.save(payinOrderRaw);

        // update wallet
        if (status === PAYMENT_STATUS.SUCCESS) {
          await this.cacheManager.del(
            REDIS_KEYS.PAYMENT_STATUS(payinOrder.orderId),
          );

          // Use safeUpdateWalletBalance for proper locking - only update totalCollections
          const updatedWallet = await this.safeUpdateWalletBalance(
            queryRunner,
            user.id,
            (wallet) => {
              wallet.totalCollections =
                (wallet.totalCollections ? +wallet.totalCollections : 0) +
                +amount;
            },
          );

          this.logger.info(
            `PAYIN WEBHOOK - Wallet updated successfully ${user.fullName}: ${LoggerPlaceHolder.Json}`,
            {
              walletId: updatedWallet.id,
              newTotalCollections: updatedWallet.totalCollections,
            },
          );
        }

        await queryRunner.commitTransaction();

        if (user?.payInWebhookUrl) {
          const webhookPayload = {
            orderId: refId,
            status,
            amount,
            txnRefId: payinOrder.txnRefId,
            ...(!isMisspelled && { utr: custRef }),
            // utr: custRef,
            message: isAmountMismatch
              ? "Amount mismatch in payin order"
              : "Not paid on same orderId",
          };
          this.logger.info(
            `PAYIN - Going to call user PAYIN WEBHOOK (${user?.payInWebhookUrl}) with payload: ${LoggerPlaceHolder.Json}`,
            webhookPayload,
          );
          axios
            .post(user.payInWebhookUrl, webhookPayload, {
              headers: {
                "Content-Type": "application/json ",
              },
            })
            .then(({ data }) => {
              this.logger.info(
                `PAYIN - User webhook (${user?.payInWebhookUrl}) sent successfully RES: ${JSON.stringify(data)}`,
              );
            })
            .catch((err) => {
              this.logger.error(
                `PAYIN - externalPayinWebhookUpdateStatus - error while sending webhook to user: ${LoggerPlaceHolder.Json}`,
                err,
              );
            });
        }

        return {
          message: "Transaction status updated successfully.",
          timestamp: new Date().toISOString(),
        };
      } catch (err: any) {
        await queryRunner.rollbackTransaction();
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error(
        `PAYIN - externalWebhookPayinUtkarsh - Error processing webhook: ${LoggerPlaceHolder.Json}`,
        error,
      );
      throw new BadRequestException(error.message);
    }
  }
}
