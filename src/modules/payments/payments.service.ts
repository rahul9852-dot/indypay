import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import axios from "axios";
import { InjectRepository } from "@nestjs/typeorm";
// import * as cheerio from "cheerio";
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
} from "./dto/external-webhook-payout.dto";
import {
  ExternalPayinWebhookFlakPayDto,
  ExternalPayinWebhookIsmartDto,
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
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";
import { AxiosService } from "@/shared/axios/axios.service";
import { appConfig } from "@/config/app.config";
import {
  convertExternalPaymentStatusToInternal,
  getUlidId,
} from "@/utils/helperFunctions.utils";
import { FALKPAY, ISMART_PAY } from "@/constants/external-api.constant";
import { WalletEntity } from "@/entities/wallet.entity";
import { getCommissions } from "@/utils/commissions.utils";
import {
  IExternalPayinPaymentRequestFlakPay,
  IExternalPayinPaymentRequestIsmart,
  IExternalPayinPaymentResponseFlakPay,
  IExternalPayinPaymentResponseIsmart,
  IExternalPayoutStatusResponseFlakPay,
} from "@/interface/external-api.interface";
import { SettlementsEntity } from "@/entities/settlements.entity";
import { getPagination } from "@/utils/pagination.utils";
import { ID_TYPE, USERS_ROLE } from "@/enums";
import { REDIS_KEYS } from "@/constants/redis-cache.constant";
import {
  getFlakPayPgConfig,
  getIsmartPayPgConfig,
} from "@/utils/pg-config.utils";
import { ApiCredentialsEntity } from "@/entities/api-credentials.entity";
import { decryptData } from "@/utils/encode-decode.utils";

const { beBaseUrl, externalPaymentConfig } = appConfig();

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
    @InjectQueue("payouts") private payoutQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,

    private readonly dataSource: DataSource,
  ) {}

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

      this.logger.info(
        `PAYIN - createTransaction - transaction: ${LoggerPlaceHolder.Json}`,
        savedTransaction,
      );

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

      this.logger.info(
        `PAYIN - calling external (${ISMART_PAY.PAYIN}) API with payload: ${LoggerPlaceHolder.Json}`,
        payload,
      );

      let externalPaymentResponse:
        | IExternalPayinPaymentResponseIsmart
        | undefined;
      try {
        externalPaymentResponse =
          await axiosServiceIsmart.postRequest<IExternalPayinPaymentResponseIsmart>(
            ISMART_PAY.PAYIN,
            payload,
          );

        this.logger.info(
          `PAYIN - createTransaction - externalPaymentResponse: ${LoggerPlaceHolder.Json}`,
          externalPaymentResponse,
        );
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

      this.logger.info(
        `PAYIN - calling external (${FALKPAY.BASE_URL}${FALKPAY.PAYIN.LIVE}) API with payload: ${LoggerPlaceHolder.Json}`,
        payload,
      );

      const externalPaymentResponse =
        await axiosServiceFlakPay.postRequest<IExternalPayinPaymentResponseFlakPay>(
          FALKPAY.PAYIN.LIVE,
          payload,
        );

      this.logger.info(
        `PAYIN - createTransaction - externalPaymentResponse: ${LoggerPlaceHolder.Json}`,
        externalPaymentResponse,
      );

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

      this.logger.info(
        `PAYIN - createTransaction - Created transaction successfully`,
      );

      // Commit transaction
      await queryRunner.commitTransaction();

      return {
        orderId: externalPaymentResponse?.data?.orderId,
        ...(externalPaymentResponse?.data?.paymentUrl && {
          intent: externalPaymentResponse?.data?.paymentUrl,
        }),
        message: "Payin created successfully",
      };
    } catch (err: any) {
      this.logger.error(
        `PAYOUT - createTransaction - Got error while creating transaction - err: ${LoggerPlaceHolder.Json}`,
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

  async createPayoutFlakPay(
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
    let userWallet = await this.walletRepository.findOne({
      where: { user: { id: user.id } },
      relations: { user: true },
    });

    if (!userWallet) {
      userWallet = await queryRunner.manager.save(
        this.walletRepository.create({ user }),
      );
    }

    const { totalServiceChange } = getCommissions({
      amount: totalAmount,
      commissionInPercentage: user.commissionInPercentagePayout,
      gstInPercentage: user.gstInPercentagePayout,
    });

    const grossTotalAmount = totalAmount + totalServiceChange;

    if (grossTotalAmount > +userWallet.availablePayoutBalance) {
      throw new BadRequestException(
        `Insufficient balance. Gross Total Amount: ${grossTotalAmount} exceeds Available Payout Balance: ${userWallet.availablePayoutBalance}`,
      );
    }

    return await queryRunner.manager.save(
      this.walletRepository.create({
        id: userWallet.id,
        availablePayoutBalance:
          +userWallet.availablePayoutBalance - grossTotalAmount,
        totalPayout: +userWallet.totalPayout + totalAmount,
        payoutServiceCharge:
          +userWallet.payoutServiceCharge + totalServiceChange,
      }),
    );
  }

  private async createPayoutOrders(
    queryRunner: QueryRunner,
    payouts: SinglePayoutDto[], // data
    user: UsersEntity,
    batchId: string,
  ) {
    return Promise.all(
      payouts.map(async (payment) => {
        const commissions = getCommissions({
          amount: +payment.amount,
          commissionInPercentage: user.commissionInPercentagePayout,
          gstInPercentage: user.gstInPercentagePayout,
        });

        const payoutOrder = await queryRunner.manager.save(
          this.payOutOrdersRepository.create({
            amount: +payment.amount,
            transferMode: payment.paymentMode || PAYOUT_PAYMENT_MODE.IMPS,
            orderId: getUlidId(ID_TYPE.MERCHANT_PAYOUT),
            batchId,
            user,
            commissionAmount: +commissions.commissionAmount,
            commissionInPercentage: +user.commissionInPercentagePayout,
            gstAmount: +commissions.gstAmount,
            gstInPercentage: +user.gstInPercentagePayout,
            netPayableAmount: +commissions.netPayableAmount,
            name: payment.beneficiaryName,
            bankAccountNumber: payment.accountNumber,
            bankIfsc: payment.ifscCode,
            bankName: payment.bankName,
            remarks: payment.remarks,
            purpose: payment.purpose,
          }),
        );

        await queryRunner.manager.save(
          this.transactionsRepository.create({
            user,
            payOutOrder: payoutOrder,
            transactionType: PAYMENT_TYPE.PAYOUT,
          }),
        );

        return payoutOrder;
      }),
    );
  }

  async checkPayInStatusTransaction({ orderId }: PayinStatusDto) {
    const payinOrder = await this.payInOrdersRepository.findOne({
      where: { orderId },
    });

    if (!payinOrder) {
      throw new NotFoundException(
        new MessageResponseDto("Payin order not found"),
      );
    }

    return {
      orderId: payinOrder.orderId,
      status: payinOrder.status,
      txnRefId: payinOrder.txnRefId,
    };
  }

  async checkPayOutStatusTransactionFlakPay({ orderId }: PayoutStatusDto) {
    const payoutOrder = await this.payOutOrdersRepository.findOne({
      where: { orderId },
      relations: { user: true },
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

      const { totalCollections, unsettledAmount } = wallet ?? {};

      const { commissionAmount, gstAmount, netPayableAmount } = getCommissions({
        amount: +payinOrder.amount,
        commissionInPercentage: +user.commissionInPercentagePayin,
        gstInPercentage: +user.gstInPercentagePayin,
      });

      const walletRaw = this.walletRepository.create({
        ...(wallet?.id && { id: wallet.id }),
        totalCollections:
          (totalCollections ? +totalCollections : 0) + +payinOrder.amount,
        unsettledAmount:
          (unsettledAmount ? +unsettledAmount : 0) + +payinOrder.amount,
        commissionAmount:
          (wallet.commissionAmount ? +wallet.commissionAmount : 0) +
          +commissionAmount,
        gstAmount: (wallet.gstAmount ? +wallet.gstAmount : 0) + +gstAmount,
        netPayableAmount:
          (wallet.netPayableAmount ? +wallet.netPayableAmount : 0) +
          +netPayableAmount,
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

      return new MessageResponseDto("Status updated successfully.");
    }

    let successCount =
      +(await this.cacheManager.get(REDIS_KEYS.SUCCESS_COUNT)) || 1;

    let isMisspelled = false;

    const jumpingCount = 10;

    if (status === PAYMENT_STATUS.SUCCESS) {
      if (successCount >= jumpingCount) {
        status = PAYMENT_STATUS.PENDING;
        successCount = 0;
        isMisspelled = true;
      } else {
        successCount += 1;
      }

      await this.cacheManager.set(
        REDIS_KEYS.SUCCESS_COUNT,
        successCount,
        1000 * 60 * 60 * 24 * 365, // 365 days
      );
    }

    const { user } = payinOrder;

    const payinOrderRaw = this.payInOrdersRepository.create({
      id: payinOrder.id,
      status,
      txnRefId,
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

      const { totalCollections, unsettledAmount } = wallet ?? {};

      const { commissionAmount, gstAmount, netPayableAmount } = getCommissions({
        amount: +payinOrder.amount,
        commissionInPercentage: +user.commissionInPercentagePayin,
        gstInPercentage: +user.gstInPercentagePayin,
      });

      const walletRaw = this.walletRepository.create({
        ...(wallet?.id && { id: wallet.id }),
        totalCollections:
          (totalCollections ? +totalCollections : 0) + +payinOrder.amount,
        unsettledAmount:
          (unsettledAmount ? +unsettledAmount : 0) + +payinOrder.amount,
        commissionAmount:
          (wallet.commissionAmount ? +wallet.commissionAmount : 0) +
          +commissionAmount,
        gstAmount: (wallet.gstAmount ? +wallet.gstAmount : 0) + +gstAmount,
        netPayableAmount:
          (wallet.netPayableAmount ? +wallet.netPayableAmount : 0) +
          +netPayableAmount,
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

  async externalWebhookPayoutFlaPay({
    status: status_code,
    orderId: order_id,
    transferId: transaction_id,
    amount,
  }: ExternalPayOutWebhookFlakPayDto) {
    const status = convertExternalPaymentStatusToInternal(
      status_code.toUpperCase(),
    );

    this.logger.info(`WEBHOOK: decrypted data: ${LoggerPlaceHolder.Json}`, {
      STATUS: status_code,
      PAYOUT_REF: order_id,
      TXN_ID: transaction_id,
      AMOUNT: amount,
    });

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
        this.logger.info(
          `SETTLEMENT WEBHOOK: Duplicate webhook of order: ${settlement.id}`,
        );

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

        const { totalCollections, unsettledAmount } = wallet ?? {};

        const { commissionAmount, gstAmount, netPayableAmount } =
          getCommissions({
            amount: +amount,
            commissionInPercentage: +commissionInPercentagePayin,
            gstInPercentage: +gstInPercentagePayin,
          });

        const walletRaw = this.walletRepository.create({
          ...(wallet?.id && { id: wallet.id }),
          totalCollections:
            (totalCollections ? +totalCollections : 0) + +amount,
          unsettledAmount: (unsettledAmount ? +unsettledAmount : 0) + +amount,
          commissionAmount:
            (wallet.commissionAmount ? +wallet.commissionAmount : 0) +
            +commissionAmount,
          gstAmount: (wallet.gstAmount ? +wallet.gstAmount : 0) + +gstAmount,
          netPayableAmount:
            (wallet.netPayableAmount ? +wallet.netPayableAmount : 0) +
            +netPayableAmount,
          user: wallet.user,
        });

        await this.walletRepository.save(walletRaw);
      }

      return new MessageResponseDto("Transaction status updated successfully.");
    } else {
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
        this.logger.info(
          `PAYOUT WEBHOOK - Duplicate webhook of order: ${order_id}`,
        );

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
        const actualAmount = +amount / (1 + totalDeductionRate / 100);
        const serviceCharge = +amount - actualAmount;

        // update wallet
        await this.walletRepository.save(
          this.walletRepository.create({
            id: wallet.id,
            availablePayoutBalance: +wallet.availablePayoutBalance + amount, // 600
            totalPayout: +wallet.totalPayout - +actualAmount, // 500
            payoutServiceCharge: +wallet.payoutServiceCharge + serviceCharge, // 100
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
        this.logger.info(
          `SETTLEMENT WEBHOOK: Duplicate webhook of order: ${settlement.id}`,
        );

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

        const { totalCollections, unsettledAmount } = wallet ?? {};

        const { commissionAmount, gstAmount, netPayableAmount } =
          getCommissions({
            amount: +amount,
            commissionInPercentage: +commissionInPercentagePayin,
            gstInPercentage: +gstInPercentagePayin,
          });

        const walletRaw = this.walletRepository.create({
          ...(wallet?.id && { id: wallet.id }),
          totalCollections:
            (totalCollections ? +totalCollections : 0) + +amount,
          unsettledAmount: (unsettledAmount ? +unsettledAmount : 0) + +amount,
          commissionAmount:
            (wallet.commissionAmount ? +wallet.commissionAmount : 0) +
            +commissionAmount,
          gstAmount: (wallet.gstAmount ? +wallet.gstAmount : 0) + +gstAmount,
          netPayableAmount:
            (wallet.netPayableAmount ? +wallet.netPayableAmount : 0) +
            +netPayableAmount,
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
        this.logger.info(
          `PAYOUT WEBHOOK - Duplicate webhook of order: ${order_id}`,
        );

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
        const actualAmount = +amount / (1 + totalDeductionRate / 100);
        const serviceCharge = +amount - actualAmount;

        // update wallet
        await this.walletRepository.save(
          this.walletRepository.create({
            id: wallet.id,
            availablePayoutBalance: +wallet.availablePayoutBalance + amount, // 600
            totalPayout: +wallet.totalPayout - +actualAmount, // 500
            payoutServiceCharge: +wallet.payoutServiceCharge + serviceCharge, // 100
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
          status: PAYMENT_STATUS.PENDING,
          isMisspelled: true,
          ...whereQuery,
        },
      ];
      if (search) {
        query.push({
          orderId: ILike(`%${search}%`),
          status: PAYMENT_STATUS.PENDING,
          isMisspelled: true,
        });
      }

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

      this.logger.info(
        `PAYIN - getMisspelledPayinTransactions - Found ${totalItems} misspelled transactions`,
      );

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
  // check payment status
  // async checkPaymentStatus(orderId: string, req: Request) {
  //   const token = req.cookies[COOKIE_KEYS.PAYMENT_LINK_TOKEN];
  //   if (!token) {
  //     throw new UnauthorizedException(
  //       new MessageResponseDto("Payment link token not found"),
  //     );
  //   }

  //   const payload = this.jwtService.verify(token, {
  //     secret: paymentLinkSecret,
  //   });

  //   if (!payload) {
  //     throw new UnauthorizedException(
  //       new MessageResponseDto("Invalid payment link token"),
  //     );
  //   }

  //   const cachedStatus = await this.cacheManager.get<PAYMENT_STATUS>(
  //     REDIS_KEYS.PAYMENT_STATUS(orderId),
  //   );
  //   if (cachedStatus) {
  //     return {
  //       success: cachedStatus === PAYMENT_STATUS.SUCCESS,
  //       failed: cachedStatus === PAYMENT_STATUS.FAILED,
  //       orderId,
  //     };
  //   }

  //   const payinOrder = await this.payInOrdersRepository.findOne({
  //     where: { orderId },
  //   });

  //   if (!payinOrder) {
  //     throw new NotFoundException(
  //       new MessageResponseDto("Payin order not found"),
  //     );
  //   }

  //   return {
  //     success: payinOrder.status === PAYMENT_STATUS.SUCCESS,
  //     failed: payinOrder.status === PAYMENT_STATUS.FAILED,
  //     orderId,
  //   };
  // }

  // private getHtmlTemplate(
  //   type: "not_found" | "success" | "failed" | "pending",
  //   data?: {
  //     amount?: number;
  //     txnRefId?: string;
  //     orderId?: string;
  //     createdAt?: Date;
  //     qrCode?: string;
  //     frontendUrl?: string;
  //     paytmIntent?: string;
  //   },
  // ): string {
  //   if (!data) {
  //     data = {};
  //   }
  //   const templates = {
  //     not_found: `
  //       <html><body><h1>Payin order not found</h1></body></html>
  //     `,
  //     success: `
  //       <html>
  //         <head>
  //           <style>
  //             body {
  //               font-family: Arial, sans-serif;
  //               display: flex;
  //               justify-content: center;
  //               align-items: center;
  //               height: 100vh;
  //               margin: 0;
  //               background-color: #f4f4f4;
  //             }
  //             .message-container {
  //               background-color: #fff;
  //               padding: 2rem;
  //               border-radius: 8px;
  //               box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  //               max-width: 600px;
  //               text-align: center;
  //             }
  //             h1 { color: #28a745; margin-bottom: 1rem; }
  //             p { color: #666; line-height: 1.6; }
  //           </style>
  //         </head>
  //         <body>
  //           <div class="message-container">
  //             <h1>Payment Successfully Processed</h1>
  //             <p>
  //               Hi there, The transaction you attempted to make has already been processed.
  //               This could happen if you accidentally clicked the payment button multiple times
  //               or if there was a delay in the payment confirmation being displayed on the website.
  //             </p>
  //             <p>
  //               If you have any doubts or concerns about the transaction, you should contact
  //               the website's customer support team to confirm that the payment has been
  //               successfully processed and that there are no issues with your account or the order.
  //             </p>
  //           </div>
  //         </body>
  //       </html>
  //     `,
  //     failed: `
  //       <html>
  //         <head>
  //           <style>
  //             body {
  //               font-family: Arial, sans-serif;
  //               display: flex;
  //               justify-content: center;
  //               align-items: center;
  //               height: 100vh;
  //               margin: 0;
  //               background-color: #f4f4f4;
  //             }
  //             .message-container {
  //               background-color: #fff;
  //               padding: 2rem;
  //               border-radius: 8px;
  //               box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  //               max-width: 600px;
  //               text-align: center;
  //             }
  //             h1 { color: #dc3545; margin-bottom: 1rem; }
  //             p { color: #666; line-height: 1.6; }
  //           </style>
  //         </head>
  //         <body>
  //           <div class="message-container">
  //             <h1>Payment Failed</h1>
  //             <p>
  //               We're sorry, but your payment could not be processed at this time.
  //               This could be due to insufficient funds, network issues, or other technical problems.
  //             </p>
  //             <p>
  //               Please try again or contact our support team if you continue to experience issues.
  //             </p>
  //           </div>
  //         </body>
  //       </html>
  //     `,
  //     pending: this.getPendingPaymentTemplate(data),
  //   };

  //   return templates[type];
  // }

  // private getPendingPaymentTemplate(data: any): string {
  //   if (!data) {
  //     data = {};
  //   }

  //   const logoImg = "/static/paybolt-icon.svg";
  //   const upiImg = "/static/upi.png";

  //   return `
  //     <!DOCTYPE html>
  //     <html lang="en">
  //       <head>
  //         <meta charset="UTF-8" />
  //         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  //         <title>Payment Page | PayBolt Technologies</title>
  //         ${this.getStyles()}
  //       </head>
  //       <body>
  //         <div id="status-overlay" style="display: none;" class="status-overlay">
  //           <div class="status-message"></div>
  //         </div>
  //         <img src="${logoImg}" class="logo" alt="PayBolt Logo" />
  //         <div class="container">
  //           <div class="details">
  //             <h2>Amount: ₹ ${data.amount}</h2>
  //             <p><span style="font-weight: bold; font-size: 18px;">Transaction ID:</span><br /> ${data.txnRefId}</p>
  //             <p><span style="font-weight: bold; font-size: 18px;">Order ID:</span><br /> ${data.orderId}</p>
  //             <p><span style="font-weight: bold; font-size: 18px;">Initiated On:</span><br /> ${formatDateTime(data.createdAt)}</p>
  //           </div>
  //           <div class="qr-code">
  //             <img src="${data.qrCode}" alt="QR Code" />
  //             <a id="pay-button" href="${data.paytmIntent}">Click to Pay Now</a><br/>
  //             <p>Please wait<br />Once payment is received, it will auto redirect.</p>
  //             <div class="payment-methods">
  //               <img class="upi" src="${upiImg}" alt="UPI" />
  //             </div>
  //           </div>
  //         </div>
  //         ${this.getPollingScript(data.orderId)}
  //       </body>
  //     </html>
  //   `;
  // }

  // private getPollingScript(orderId: string): string {
  //   return `
  //     <script>
  //       class PaymentPoller {
  //         constructor(orderId, checkInterval = 4000) {
  //           this.orderId = orderId;
  //           this.checkInterval = checkInterval;
  //           this.timeoutId = null;
  //           this.overlay = document.getElementById('status-overlay');
  //           this.statusMessage = document.querySelector('.status-message');
  //         }

  //         showStatusMessage(type, message) {
  //           this.overlay.style.display = 'flex';
  //           this.statusMessage.innerHTML = message;
  //           this.statusMessage.className = 'status-message ' + type;
  //         }

  //         async checkStatus() {
  //           try {
  //             const response = await fetch(
  //               '${beBaseUrl}/api/v1/payments/redirect/payment-link/status/' + this.orderId
  //             );
  //             const resJson = await response.json();

  //             const data = resJson?.data;

  //             if(!data) {
  //               throw new Error("token");
  //             }

  //             if (data?.success) {
  //               this.stop();
  //               this.showStatusMessage('success', \`
  //                 <h1>Payment Successfully Processed</h1>
  //                 <p>
  //                   Hi there, The transaction you attempted to make has already been processed.
  //                   This could happen if you accidentally clicked the payment button multiple times
  //                   or if there was a delay in the payment confirmation being displayed on the website.
  //                 </p>
  //                 <p>
  //                   If you have any doubts or concerns about the transaction, you should contact
  //                   the website's customer support team to confirm that the payment has been
  //                   successfully processed and that there are no issues with your account or the order.
  //                 </p>
  //               \`);
  //             } else if (data?.failed) {
  //               this.stop();
  //               this.showStatusMessage('error', \`
  //                 <h1>Payment Failed</h1>
  //                 <p>
  //                   We're sorry, but your payment could not be processed at this time.
  //                   This could be due to insufficient funds, network issues, or other technical problems.
  //                 </p>
  //                 <p>
  //                   Please try again or contact our support team if you continue to experience issues.
  //                 </p>
  //               \`);
  //             } else {
  //               this.timeoutId = setTimeout(
  //                 () => this.checkStatus(),
  //                 this.checkInterval
  //               );
  //             }
  //           } catch (error) {
  //             if(error?.message === "token") {
  //               this.stop();
  //               this.showStatusMessage('error', \`
  //                 <h1>Unauthorized</h1>
  //                 <p>
  //                   We're sorry, but your payment could not be processed at this time.
  //                 </p>
  //                 <p>
  //                   Please try again or contact our support team if you continue to experience issues.
  //                 </p>
  //               \`);
  //             }else {
  //               this.stop();
  //               this.showStatusMessage('error', \`
  //               <h1>Error</h1>
  //               <p>An error occurred while processing your payment. Please try again later.</p>
  //               \`);
  //             }
  //           }
  //         }

  //         start() {
  //           this.checkStatus();
  //         }

  //         stop() {
  //           if (this.timeoutId) {
  //             clearTimeout(this.timeoutId);
  //           }
  //         }
  //       }

  //       const poller = new PaymentPoller('${orderId}');
  //       poller.start();
  //     </script>
  //   `;
  // }

  // private getStyles(): string {
  //   return `
  //     <style>
  //       body {
  //         font-family: Arial, sans-serif;
  //         margin: 0;
  //         padding: 0;
  //         background-color: #f4f4f4;
  //         display: flex;
  //         justify-content: center;
  //         align-items: center;
  //         flex-direction: column;
  //         gap: 20px;
  //         height: 100vh;
  //       }

  //       .logo {
  //         max-width: 200px;
  //         margin: 0 auto;
  //       }

  //       .container {
  //         background-color: #fff;
  //         display: flex;
  //         box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  //         border-radius: 8px;
  //         overflow: hidden;
  //       }

  //       #pay-button {
  //         background-color: #007bff;
  //         color: #fff;
  //         border: none;
  //         padding: 10px 20px;
  //         border-radius: 4px;
  //         cursor: pointer;
  //         text-decoration: none;
  //       }

  //       #pay-button:hover {
  //         background-color: #0056b3;
  //       }

  //       @media (min-width: 768px) {
  //         #pay-button {
  //           display: none;
  //           visible: hidden;
  //         }
  //       }

  //       .status-overlay {
  //         position: fixed;
  //         top: 0;
  //         left: 0;
  //         right: 0;
  //         bottom: 0;
  //         background-color: #f5f5f5;
  //         display: flex;
  //         justify-content: center;
  //         align-items: center;
  //         z-index: 1000;
  //       }

  //       .status-message {
  //         background-color: white;
  //         padding: 2rem;
  //         border-radius: 8px;
  //         box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  //         max-width: 600px;
  //         text-align: center;
  //       }

  //       .status-message.success h1 { color: #28a745; }
  //       .status-message.error h1 { color: #dc3545; }
  //       .status-message p { color: #666; line-height: 1.6; }

  //       @media (max-width: 768px) {
  //         .container {
  //           flex-direction: column;
  //         }
  //       }

  //       .details {
  //         padding: 20px;
  //         flex: 1;
  //         min-width: 300px;
  //       }

  //       .details h2 {
  //         color: #6020a0;
  //         margin: 0 0 20px;
  //         font-size: 24px;
  //       }

  //       .details p {
  //         margin: 10px 0;
  //         font-size: 14px;
  //         color: #333;
  //       }

  //       .details p span {
  //         font-weight: bold;
  //       }

  //       .qr-code {
  //         flex: 1;
  //         background-color: #f9f9f9;
  //         display: flex;
  //         flex-direction: column;
  //         align-items: center;
  //         justify-content: center;
  //         padding: 20px;
  //       }

  //       .qr-code img {
  //         width: 150px;
  //         height: 150px;
  //         margin-bottom: 20px;
  //       }

  //       .qr-code p {
  //         margin: 10px 0;
  //         font-size: 14px;
  //         text-align: center;
  //         color: #555;
  //       }

  //       .payment-methods {
  //         display: flex;
  //         justify-content: center;
  //         flex-wrap: wrap;
  //         gap: 10px;
  //         margin-top: 10px;
  //       }

  //       .payment-methods img {
  //         width: 300px;
  //         height: auto;

  //       }
  //     </style>
  //   `;
  // }

  // async redirectPaymentLink(payinId: string, res: Response) {
  //   const payinOrder = await this.payInOrdersRepository.findOne({
  //     where: { id: payinId },
  //   });

  //   if (!payinOrder) {
  //     return res.send(this.getHtmlTemplate("not_found"));
  //   }

  //   if (payinOrder.status === PAYMENT_STATUS.SUCCESS) {
  //     return res.send(this.getHtmlTemplate("success"));
  //   }

  //   if (payinOrder.status === PAYMENT_STATUS.FAILED) {
  //     return res.send(this.getHtmlTemplate("failed"));
  //   }

  //   const qrCode = await generateQrCode(payinOrder.intent);
  //   const frontendUrl = "http://localhost:3000";

  //   const token = this.jwtService.sign(
  //     {
  //       id: payinOrder.id,
  //       orderId: payinOrder.orderId,
  //     },
  //     {
  //       secret: paymentLinkSecret,
  //       expiresIn: 1000 * 60 * 30, // 30m
  //     },
  //   );

  //   return res
  //     .cookie(COOKIE_KEYS.PAYMENT_LINK_TOKEN, token, {
  //       ...cookieOptions,
  //     })
  //     .send(
  //       this.getHtmlTemplate("pending", {
  //         amount: payinOrder.amount,
  //         txnRefId: payinOrder.txnRefId,
  //         orderId: payinOrder.orderId,
  //         createdAt: payinOrder.createdAt,
  //         qrCode,
  //         frontendUrl,
  //         ...{ paymentLink: payinOrder.paymentLink },
  //       }),
  //     );
  // }
}
