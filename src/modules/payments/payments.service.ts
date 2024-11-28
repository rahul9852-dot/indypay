import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import axios from "axios";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import {
  CreatePayinTransactionAnviNeoDto,
  CreatePayinTransactionIsmartDto,
  PayinStatusDto,
} from "./dto/create-payin-payment.dto";
import { PayoutStatusDto } from "./dto/create-payout-payment.dto";
import { ExternalPayoutWebhookIsmartDto } from "./dto/external-webhook-payout.dto";
import { ExternalPayinWebhookIsmartDto } from "./dto/external-webhook-payin.dto";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { MessageResponseDto } from "@/dtos/common.dto";
import { PAYMENT_STATUS, PAYMENT_TYPE } from "@/enums/payment.enum";
import { UsersEntity } from "@/entities/user.entity";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";
import { AxiosService } from "@/shared/axios/axios.service";
import { appConfig } from "@/config/app.config";
import { convertExternalPaymentStatusToInternal } from "@/utils/helperFunctions.utils";
import { ANVITAPAY, ISMART_PAY } from "@/constants/external-api.constant";
import { WalletEntity } from "@/entities/wallet.entity";
import { getCommissions } from "@/utils/commissions.utils";
import {
  IExternalPayinPaymentRequestAnviNeo,
  IExternalPayinPaymentRequestIsmart,
  IExternalPayinPaymentResponseAnviNeo,
  IExternalPayinPaymentResponseIsmart,
} from "@/interface/external-api.interface";
import { SettlementsEntity } from "@/entities/settlements.entity";

const {
  beBaseUrl,
  externalPaymentConfig: { baseUrl, clientId, clientSecret },
} = appConfig();

@Injectable()
export class PaymentsService {
  private readonly logger = new CustomLogger(PaymentsService.name);
  private readonly axiosService = new AxiosService(baseUrl, {
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
        pay_type: "UPI",
        redirect_url: frontendUrl,
        vpa,
        webhook_url,
      };

      this.logger.info(
        `PAYIN - calling external (${ISMART_PAY.PAYIN}) API with payload: ${LoggerPlaceHolder.Json}`,
        payload,
      );

      const externalPaymentResponse =
        await this.axiosService.postRequest<IExternalPayinPaymentResponseIsmart>(
          ISMART_PAY.PAYIN,
          payload,
        );

      this.logger.info(
        `PAYIN - createTransaction - externalPaymentResponse: ${LoggerPlaceHolder.Json}`,
        externalPaymentResponse,
      );

      if (!externalPaymentResponse.status) {
        throw new BadRequestException(
          externalPaymentResponse?.errors || "Something went wrong",
        );
      }

      const internalStatus = convertExternalPaymentStatusToInternal(
        externalPaymentResponse.status_code,
      );
      // 6. save external payment
      const savedOrder = await queryRunner.manager.save(
        this.payInOrdersRepository.create({
          ...savedPayinOrder,
          ...(externalPaymentResponse?.intent && {
            intent: externalPaymentResponse?.intent,
          }),
          status: internalStatus,
          txnRefId: externalPaymentResponse.transaction_id,
        }),
      );

      await queryRunner.commitTransaction();

      return {
        orderId: createPayinTransactionDto.orderId,
        message: "Payment Request Sent Successfully",
        ...(externalPaymentResponse?.intent && {
          intent: externalPaymentResponse?.intent,
        }),
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

  async externalWebhookPayout({
    status_code,
    order_id,
    transaction_id,
    amount,
  }: ExternalPayoutWebhookIsmartDto) {
    const status = convertExternalPaymentStatusToInternal(status_code);

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
}
