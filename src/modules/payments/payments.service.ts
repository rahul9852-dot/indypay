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
  Repository,
} from "typeorm";
import { JwtService } from "@nestjs/jwt";
import {
  CreatePayinTransactionAnviNeoDto,
  CreatePayinTransactionIsmartDto,
  PayinStatusDto,
} from "./dto/create-payin-payment.dto";
import {
  CreatePayoutIsmartDto,
  PayoutStatusDto,
} from "./dto/create-payout-payment.dto";
import { ExternalPayOutWebhookPayNProDto } from "./dto/external-webhook-payout.dto";
import { ExternalPayinWebhookIsmartDto } from "./dto/external-webhook-payin.dto";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { MessageResponseDto, PaginationWithDateDto } from "@/dtos/common.dto";
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
import { ANVITAPAY, ISMART_PAY } from "@/constants/external-api.constant";
import { WalletEntity } from "@/entities/wallet.entity";
import { getCommissions } from "@/utils/commissions.utils";
import {
  IExternalPayinPaymentRequestAnviNeo,
  IExternalPayinPaymentRequestIsmart,
  IExternalPayinPaymentResponseAnviNeo,
  IExternalPayinPaymentResponseIsmart,
  IExternalPayoutRequestIsmart,
  IExternalPayoutResponseIsmart,
} from "@/interface/external-api.interface";
import { SettlementsEntity } from "@/entities/settlements.entity";
import { getPagination } from "@/utils/pagination.utils";
import { ID_TYPE, USERS_ROLE } from "@/enums";
import { REDIS_KEYS } from "@/constants/redis-cache.constant";

const {
  beBaseUrl,
  jwtConfig: { paymentLinkSecret },
  externalPaymentConfig: { clientId, clientSecret },
} = appConfig();

@Injectable()
export class PaymentsService {
  private readonly logger = new CustomLogger(PaymentsService.name);
  private readonly axiosService = new AxiosService(ISMART_PAY.BASE_URL, {
    headers: {
      "Content-Type": "application/json",
      mid: clientId,
      key: clientSecret,
    },
  });

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
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly jwtService: JwtService,

    private readonly dataSource: DataSource,
  ) {}

  async createTransactionPayinAnviNeo(
    createPayinTransactionDto: CreatePayinTransactionAnviNeoDto,
    user: UsersEntity,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();

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
        ...createPayinTransactionDto,
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

      // 5. create external payment
      const payload: IExternalPayinPaymentRequestAnviNeo = {
        amount: createPayinTransactionDto.amount.toFixed(2),
        ref_no: createPayinTransactionDto.orderId,
        customer_email: createPayinTransactionDto.email,
        customer_mobile: createPayinTransactionDto.mobile,
        customer_name: createPayinTransactionDto.name,
      };

      this.logger.info(
        `PAYIN - calling external (${ANVITAPAY.PAYIN}) API with payload: ${LoggerPlaceHolder.Json}`,
        payload,
      );

      const externalPaymentResponse =
        await this.axiosService.postRequest<IExternalPayinPaymentResponseAnviNeo>(
          ANVITAPAY.PAYIN,
          payload,
        );

      this.logger.info(
        `PAYIN - createTransaction - externalPaymentResponse: ${LoggerPlaceHolder.Json}`,
        externalPaymentResponse,
      );

      if (externalPaymentResponse.res_code !== "101") {
        throw new BadRequestException(externalPaymentResponse.msg);
      }
      // 6. save external payment
      const savedOrder = await queryRunner.manager.save(
        this.payInOrdersRepository.create({
          ...savedPayinOrder,
          intent: externalPaymentResponse.data.qr,
          mobile: createPayinTransactionDto.mobile,
        }),
      );

      await queryRunner.commitTransaction();

      return {
        orderId: createPayinTransactionDto.orderId,
        intent: externalPaymentResponse.data.qr,
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

  async createTransactionPayinIsmart(
    createPayinTransactionDto: CreatePayinTransactionIsmartDto,
    user: UsersEntity,
  ) {
    const { amount, email, mobile, name, orderId, vpa } =
      createPayinTransactionDto;
    const queryRunner = this.dataSource.createQueryRunner();

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
          await this.axiosService.postRequest<IExternalPayinPaymentResponseIsmart>(
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
        paymentLink: externalPaymentResponse?.payment_url,
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

  async createPayoutIsmart(
    createPayoutIsmartDto: CreatePayoutIsmartDto,
    user: UsersEntity,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();

    // Start transaction
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { data } = createPayoutIsmartDto;
      if (data.length > 1000) {
        throw new BadRequestException("Maximum 1000 payouts allowed");
      }

      const totalAmount = data.reduce((acc, curr) => {
        if (curr.amount <= 0) {
          throw new BadRequestException("Amount should be greater than 0");
        }

        return acc + curr.amount;
      }, 0);

      let userWallet = await this.walletRepository.findOne({
        where: {
          user: {
            id: user.id,
          },
        },
        relations: {
          user: true,
        },
      });

      if (!userWallet) {
        userWallet = await queryRunner.manager.save(
          this.walletRepository.create({
            user,
          }),
        );
      }

      const { totalServiceChange } = getCommissions({
        amount: totalAmount,
        commissionInPercentage: user.commissionInPercentagePayout,
        gstInPercentage: user.gstInPercentagePayout,
      });

      const grossTotalAmount = totalAmount + totalServiceChange;

      if (grossTotalAmount > userWallet.netPayableAmount) {
        throw new BadRequestException(
          `Insufficient balance. Gross Total Amount: ${grossTotalAmount} exceeds Net Payable Amount: ${userWallet.netPayableAmount}`,
        );
      }

      const allPromises = data.map(async (payment) => {
        const commissions = getCommissions({
          amount: +payment.amount,
          commissionInPercentage: user.commissionInPercentagePayout,
          gstInPercentage: user.gstInPercentagePayout,
        });

        const payOutOrder = await queryRunner.manager.save(
          this.payOutOrdersRepository.create({
            amount: +payment.amount,
            transferMode: payment.paymentMode || PAYOUT_PAYMENT_MODE.IMPS,
            orderId: getUlidId(ID_TYPE.MERCHANT_PAYOUT),
            user,
            commissionAmount: +commissions.commissionAmount,
            commissionInPercentage: +user.commissionInPercentagePayout,
            gstAmount: +commissions.gstAmount,
            gstInPercentage: +user.gstInPercentagePayout,
            netPayableAmount: +commissions.netPayableAmount,
          }),
        );

        await queryRunner.manager.save(
          this.transactionsRepository.create({
            user,
            payOutOrder,
            transactionType: PAYMENT_TYPE.PAYOUT,
          }),
        );

        const payload: IExternalPayoutRequestIsmart = {
          amount: +payment.amount,
          currency: "INR",
          narration: payment.remarks,
          order_id: payOutOrder.orderId,
          phone_number: user.mobile,
          purpose: "Payout to " + payment.beneficiaryName,

          payment_details: {
            account_number: payment.accountNumber,
            ifsc_code: payment.ifscCode,
            beneficiary_name: payment.beneficiaryName,
            type: "NB",
            mode: payment.paymentMode || PAYOUT_PAYMENT_MODE.RTGS,
          },
        };

        return this.axiosService.postRequest<IExternalPayoutResponseIsmart>(
          ISMART_PAY.PAYOUT,
          payload,
        );
      });

      const externalPayoutResponses = await Promise.all(allPromises);

      for await (const externalPayoutResponse of externalPayoutResponses) {
        if (!externalPayoutResponse.status) {
          throw new BadRequestException(
            externalPayoutResponse?.errors || "Something went wrong",
          );
        }

        const status = convertExternalPaymentStatusToInternal(
          externalPayoutResponse.status_code,
        );

        const payOutOrder = await this.payOutOrdersRepository.findOne({
          where: {
            orderId: externalPayoutResponse.order_id,
          },
        });

        if (!payOutOrder) {
          throw new BadRequestException("Payout order not found");
        }

        await queryRunner.manager.save(
          this.payOutOrdersRepository.create({
            id: payOutOrder.id,
            status,
            transferId: externalPayoutResponse.transaction_id,
          }),
        );
      }

      await queryRunner.commitTransaction();

      return {
        message: "Payout created successfully",
        data: externalPayoutResponses,
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

  // async createTransactionPayinPayNPro(
  //   createPayinTransactionDto: CreatePayinTransactionPayNProDto,
  //   user: UsersEntity,
  //   res: Response,
  // ) {
  //   const { amount, email, mobile, name } = createPayinTransactionDto;
  //   const queryRunner = this.dataSource.createQueryRunner();

  //   // Start transaction
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     const { commissionAmount, gstAmount, netPayableAmount } = getCommissions({
  //       amount,
  //       commissionInPercentage: user.commissionInPercentagePayin,
  //       gstInPercentage: user.gstInPercentagePayin,
  //     });

  //     const wallet = await this.walletRepository.findOne({
  //       where: {
  //         user: {
  //           id: user.id,
  //         },
  //       },
  //       relations: {
  //         user: true,
  //       },
  //     });

  //     if (!wallet) {
  //       await queryRunner.manager.save(
  //         this.walletRepository.create({
  //           user,
  //         }),
  //       );
  //     }

  //     // 1. create pay-in order
  //     const payinOrder = this.payInOrdersRepository.create({
  //       user,
  //       amount,
  //       email,
  //       name,
  //       mobile,
  //       commissionAmount,
  //       gstAmount,
  //       netPayableAmount,
  //       orderId: getUlidId("odr"), // add dummy order id - we will update once order will create
  //     });

  //     // 2. save pay-in order
  //     const savedPayinOrder = await queryRunner.manager.save(payinOrder);

  //     // 3. create transaction
  //     const transaction = this.transactionsRepository.create({
  //       user,
  //       payInOrder: savedPayinOrder,
  //       transactionType: PAYMENT_TYPE.PAYIN,
  //     });

  //     // 4. save transaction
  //     const savedTransaction = await queryRunner.manager.save(transaction);

  //     this.logger.info(
  //       `PAYIN - createTransaction - transaction: ${LoggerPlaceHolder.Json}`,
  //       savedTransaction,
  //     );

  //     // 5. create external payment
  //     const payload: IExternalPayinPaymentRequestPayNPro = {
  //       amount: createPayinTransactionDto.amount.toFixed(2),
  //       txnCurr: "INR",
  //       email: createPayinTransactionDto.email,
  //       mobile: createPayinTransactionDto.mobile,
  //       name: createPayinTransactionDto.name,
  //       key_id: clientId,
  //       key_secret: clientSecret,
  //     };

  //     const signature = generateSignature(payload);

  //     const payloadWithSignature: IEncryptData = {
  //       ...payload,
  //       signature,
  //     };

  //     const encryptedData = encryptPayNPro(
  //       payloadWithSignature,
  //       encryptionSalt,
  //       aesSecretKey,
  //     );

  //     this.logger.info(
  //       `PAYIN - calling external (${PAYNPRO.PAYIN.LIVE_ENDPOINT}) API with payload: ${LoggerPlaceHolder.Json}`,
  //       payload,
  //     );

  //     const externalEncryptedResponse =
  //       await this.axiosService.postRequest<IExternalPayinPaymentResponsePayNPro>(
  //         PAYNPRO.PAYIN.LIVE_ENDPOINT,
  //         {
  //           key_id: clientId,
  //           data: encryptedData,
  //         },
  //       );

  //     if (
  //       externalEncryptedResponse?.data?.trim() === "" &&
  //       externalEncryptedResponse?.statusCode !== "200"
  //     ) {
  //       this.logger.error(
  //         `PAYIN - createTransaction - ERROR: ${externalEncryptedResponse?.statusCode} ${externalEncryptedResponse?.Description}`,
  //       );
  //       throw new BadRequestException(externalEncryptedResponse.Description);
  //     }

  //     const externalPaymentResponse = decryptPayNPro(
  //       externalEncryptedResponse.data,
  //       encryptionSalt,
  //       aesSecretKey,
  //     );

  //     this.logger.info(
  //       `PAYIN - createTransaction - externalPaymentResponse: ${LoggerPlaceHolder.Json}`,
  //       externalPaymentResponse,
  //     );

  //     if (
  //       externalPaymentResponse.status.toLowerCase() !== "success" ||
  //       externalPaymentResponse.statusCode !== "200"
  //     ) {
  //       throw new BadRequestException(
  //         externalPaymentResponse?.description || "Something went wrong",
  //       );
  //     }

  //     // const internalStatus = convertExternalPaymentStatusToInternal(
  //     //   externalPaymentResponse.status?.toUpperCase(),
  //     // );
  //     // 6. save external payment
  //     const savedOrder = await queryRunner.manager.save(
  //       this.payInOrdersRepository.create({
  //         ...savedPayinOrder,
  //         ...(externalPaymentResponse?.upiIntent && {
  //           intent: externalPaymentResponse?.upiIntent,
  //         }),
  //         // status: internalStatus,
  //         txnRefId: externalPaymentResponse.transactionId,
  //         orderId: externalPaymentResponse.orderId, // here we are updating dummy => real order id generated by bank
  //       }),
  //     );

  //     if (!externalPaymentResponse?.upiIntent?.trim()) {
  //       throw new BadRequestException(
  //         new MessageResponseDto("Something went wrong"),
  //       );
  //     }

  //     const qr = await generateQrCode(externalPaymentResponse.upiIntent); // base64 qr image
  //     const img = qr.replace(/^data:image\/png;base64,/, "");
  //     const imageBuffer = Buffer.from(img, "base64");

  //     await queryRunner.commitTransaction();

  //     res.setHeader("Content-Type", "image/png");
  //     res.setHeader("Content-Disposition", "attachment; filename=qr.png");
  //     res.setHeader("Content-Length", imageBuffer.length);

  //     this.logger.info(
  //       `PAYIN - createTransaction - Created transaction successfully`,
  //     );

  //     return res.send(imageBuffer);

  //     // return {
  //     //   orderId: externalPaymentResponse.orderId,
  //     // ...(externalPaymentResponse?.upiIntent && {
  //     //   intent: externalPaymentResponse?.upiIntent,
  //     // }),
  //     // };

  //     // Commit transaction
  //   } catch (err: any) {
  //     this.logger.error(
  //       `PAYIN - createTransaction - Got error while creating transaction - err: ${LoggerPlaceHolder.Json}`,
  //       err,
  //     );
  //     // Rollback transaction if any operation fails
  //     await queryRunner.rollbackTransaction();
  //     throw new BadRequestException(err.message);
  //   } finally {
  //     // Release the queryRunner to avoid memory leaks
  //     await queryRunner.release();
  //   }
  // }

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

  async checkPayOutStatusTransaction({ orderId }: PayoutStatusDto) {
    const payoutOrder = await this.payOutOrdersRepository.findOne({
      where: { orderId },
    });

    if (!payoutOrder) {
      throw new NotFoundException(
        new MessageResponseDto("Payout order not found"),
      );
    }

    return {
      orderId: payoutOrder.orderId,
      status: payoutOrder.status,
      transferId: payoutOrder.transferId,
    };
  }

  async findAllTransactions() {
    return this.transactionsRepository.find();
  }

  async findTransaction(id: string) {
    return this.transactionsRepository.findOne({ where: { id } });
  }

  // Ismart
  async externalWebhookPayin(
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

  // async externalWebhookPayinPayNPro(
  //   externalPayinWebhookDto: ExternalPayinWebhookPayNProDto,
  // ) {
  //   const decryptedData = decryptPayNPro(
  //     externalPayinWebhookDto.data,
  //     encryptionSalt,
  //     aesSecretKey,
  //   ) as unknown as IWebhookDataPayNPro;

  //   const {
  //     orderId,
  //     status: status_code,
  //     transactionId: txnRefId,
  //     description,
  //   } = decryptedData;

  //   this.logger.info(
  //     `WEBHOOK: decrypted data: ${LoggerPlaceHolder.Json}`,
  //     decryptedData,
  //   );

  //   const status = convertExternalPaymentStatusToInternal(status_code);

  //   const isSuccess =
  //     description === "Transaction Success" &&
  //     status === PAYMENT_STATUS.SUCCESS;
  //   const isFailed =
  //     description === "Transaction Failed" && status === "FAILED";

  //   const payinOrder = await this.payInOrdersRepository.findOne({
  //     where: {
  //       orderId,
  //     },
  //     relations: ["user"],
  //   });

  //   if (!payinOrder) {
  //     throw new NotFoundException(
  //       new MessageResponseDto("Payin order not found"),
  //     );
  //   }

  //   if (status === payinOrder.status) {
  //     this.logger.info(
  //       `PAYIN WEBHOOK - Duplicate webhook of order: ${payinOrder.orderId}`,
  //     );

  //     return new MessageResponseDto("Status updated successfully.");
  //   }

  //   const { user } = payinOrder;

  //   const payinOrderRaw = this.payInOrdersRepository.create({
  //     id: payinOrder.id,
  //     status,
  //     txnRefId,
  //     ...(isSuccess && {
  //       successAt: new Date(),
  //     }),
  //     ...(isFailed && {
  //       failureAt: new Date(),
  //     }),
  //   });

  //   await this.payInOrdersRepository.save(payinOrderRaw);

  //   // update wallet
  //   if (isSuccess) {
  //     const wallet = await this.walletRepository.findOne({
  //       where: { user: { id: user.id } },
  //       relations: ["user"],
  //     });

  //     const { totalCollections, unsettledAmount } = wallet ?? {};

  //     const { commissionAmount, gstAmount, netPayableAmount } = getCommissions({
  //       amount: +payinOrder.amount,
  //       commissionInPercentage: +user.commissionInPercentagePayin,
  //       gstInPercentage: +user.gstInPercentagePayin,
  //     });

  //     const walletRaw = this.walletRepository.create({
  //       ...(wallet?.id && { id: wallet.id }),
  //       totalCollections:
  //         (totalCollections ? +totalCollections : 0) + +payinOrder.amount,
  //       unsettledAmount:
  //         (unsettledAmount ? +unsettledAmount : 0) + +payinOrder.amount,
  //       commissionAmount:
  //         (wallet.commissionAmount ? +wallet.commissionAmount : 0) +
  //         +commissionAmount,
  //       gstAmount: (wallet.gstAmount ? +wallet.gstAmount : 0) + +gstAmount,
  //       netPayableAmount:
  //         (wallet.netPayableAmount ? +wallet.netPayableAmount : 0) +
  //         +netPayableAmount,
  //       user,
  //     });

  //     await this.walletRepository.save(walletRaw);

  //     this.logger.info(
  //       `PAYIN WEBHOOK - externalWebhookUpdateStatusPayin - wallet updated successfully ${user.fullName}: ${LoggerPlaceHolder.Json}`,
  //       walletRaw,
  //     );
  //   }

  //   if (user?.payInWebhookUrl) {
  //     const webhookPayload = {
  //       orderId,
  //       status,
  //       amount: payinOrder.amount,
  //       txnRefId: payinOrder.txnRefId, // utr
  //     };
  //     this.logger.info(
  //       `PAYIN - Going to call user PAYIN WEBHOOK (${user?.payInWebhookUrl}) with payload: ${LoggerPlaceHolder.Json}`,
  //       webhookPayload,
  //     );
  //     axios
  //       .post(user.payInWebhookUrl, webhookPayload, {
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //       })
  //       .then(() => {
  //         this.logger.info(
  //           `PAYIN - User webhook (${user?.payInWebhookUrl}) sent successfully: ${LoggerPlaceHolder.Json}`,
  //           user,
  //         );
  //       })
  //       .catch((err) => {
  //         this.logger.error(
  //           `PAYIN - externalPayinWebhookUpdateStatus - error while sending webhook to user: ${LoggerPlaceHolder.Json}`,
  //           err,
  //         );
  //       });
  //   }

  //   return new MessageResponseDto("Transaction status updated successfully.");
  // }

  async externalWebhookPayout({
    STATUS: status_code,
    PAYOUT_REF: order_id,
    TXN_ID: transaction_id,
    AMOUNT: amount,
  }: ExternalPayOutWebhookPayNProDto) {
    const status = convertExternalPaymentStatusToInternal(
      status_code.toUpperCase(),
    );

    this.logger.info(`WEBHOOK: decrypted data: ${LoggerPlaceHolder.Json}`, {
      STATUS: status_code,
      PAYOUT_REF: order_id,
      TXN_ID: transaction_id,
      AMOUNT: amount,
    });

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
      throw new BadRequestException(
        new MessageResponseDto(
          `Duplicate Webhook for PAYOUT/SETTLEMENT : ${order_id}`,
        ),
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

      const { commissionInPercentagePayin, gstInPercentagePayin } = wallet.user;

      const { totalCollections, unsettledAmount } = wallet ?? {};

      const { commissionAmount, gstAmount, netPayableAmount } = getCommissions({
        amount: +amount,
        commissionInPercentage: +commissionInPercentagePayin,
        gstInPercentage: +gstInPercentagePayin,
      });

      const walletRaw = this.walletRepository.create({
        ...(wallet?.id && { id: wallet.id }),
        totalCollections: (totalCollections ? +totalCollections : 0) + +amount,
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
    }: PaginationWithDateDto,
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

    if ([USERS_ROLE.ADMIN, USERS_ROLE.OWNER].includes(user.role)) {
      if (search) {
        const orderIdSearch = {
          orderId: ILike(`%${search}%`),
        };

        const txnRefSearch = {
          txnRefId: ILike(`%${search}%`),
        };

        const userIdSearch = {
          user: {
            id: ILike(`%${search}%`),
          },
        };

        const nameSearch = {
          user: {
            fullName: ILike(`%${search}%`),
          },
        };

        const emailSearch = {
          user: {
            email: ILike(`%${search}%`),
          },
        };

        const mobileSearch = {
          user: {
            mobile: ILike(`%${search}%`),
          },
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
        };

        const orderIdSearch = {
          user: {
            id: user.id,
          },
          orderId: ILike(`%${search}%`),
        };

        const txnRefSearch = {
          user: {
            id: user.id,
          },
          txnRefId: ILike(`%${search}%`),
        };

        const nameSearch = {
          user: {
            id: user.id,
            fullName: ILike(`%${search}%`),
          },
        };

        const emailSearch = {
          user: {
            id: user.id,
            email: ILike(`%${search}%`),
          },
        };

        const mobileSearch = {
          user: {
            id: user.id,
            mobile: ILike(`%${search}%`),
          },
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
        });
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
