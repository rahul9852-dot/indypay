import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import axios from "axios";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import {
  CreatePayinTransactionDto,
  PayinStatusDto,
} from "./dto/create-payin-payment.dto";
import {
  CreatePayoutTransactionDto,
  PayoutStatusDto,
} from "./dto/create-payout-payment.dto";
import { ExternalPayinWebhookDto } from "./dto/external-webhook-payin.dto";
import { ExternalPayoutWebhookDto } from "./dto/external-webhook-payout.dto";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { MessageResponseDto } from "@/dtos/common.dto";
import {
  EXTERNAL_PAYOUT_PAYMENT_STATUS,
  PAYMENT_STATUS,
  PAYMENT_TYPE,
} from "@/enums/payment.enum";
import { UsersEntity } from "@/entities/user.entity";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import {
  IExternalPayinPaymentRequest,
  IExternalPayinPaymentResponse,
  IExternalPayoutPaymentResponse,
} from "@/interface/external-api.interface";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";
import { AxiosService } from "@/shared/axios/axios.service";
import { appConfig } from "@/config/app.config";
import { PayoutBatchesEntity } from "@/entities/payout-batch.entity";
import { convertExternalPaymentStatusToInternal } from "@/utils/helperFunctions.utils";
import { ANVITAPAY } from "@/constants/external-api.constant";

const {
  externalPaymentConfig: { baseUrl, clientId, clientSecret, clientSign },
} = appConfig();

@Injectable()
export class PaymentsService {
  private readonly logger = new CustomLogger(PaymentsService.name);
  private readonly axiosService = new AxiosService(baseUrl, {
    headers: {
      "Content-Type": "application/json",
      PPI: clientId,
      AUTH: clientSecret,
      SIGN: clientSign,
    },
  });
  constructor(
    @InjectRepository(TransactionsEntity)
    private readonly transactionsRepository: Repository<TransactionsEntity>,
    @InjectRepository(PayInOrdersEntity)
    private readonly payInOrdersRepository: Repository<PayInOrdersEntity>,
    @InjectRepository(PayOutOrdersEntity)
    private readonly payOutOrdersRepository: Repository<PayOutOrdersEntity>,
    @InjectRepository(PayoutBatchesEntity)
    private readonly payoutBatchRepository: Repository<PayoutBatchesEntity>,

    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new Payin transaction
   * @param createPayinTransactionDto Payin transaction details
   * @param user User making the transaction
   * @returns transaction details
   */
  async createTransactionPayin(
    createPayinTransactionDto: CreatePayinTransactionDto,
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
      const payload: IExternalPayinPaymentRequest = {
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
        await this.axiosService.postRequest<IExternalPayinPaymentResponse>(
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

  async createTransactionPayout(
    createPayoutTransactionDto: CreatePayoutTransactionDto,
    user: UsersEntity,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();

    // Start transaction
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingOrder = await this.payOutOrdersRepository.exists({
        where: {
          orderId: createPayoutTransactionDto.orderId,
        },
      });

      if (existingOrder) {
        throw new BadRequestException(
          new MessageResponseDto(
            "PAYOUT - Order id already exists. Please with different order id.",
          ),
        );
      }
      // 1. create pay-out order
      const payoutOrder = this.payOutOrdersRepository.create({
        user,
        ...createPayoutTransactionDto,
      });

      // 2. save pay-out order
      const savedPayoutOrder = await queryRunner.manager.save(payoutOrder);

      // 3. create transaction
      const transaction = this.transactionsRepository.create({
        user,
        payOutOrder: savedPayoutOrder,
        transactionType: PAYMENT_TYPE.PAYOUT,
      });

      // 4. save transaction
      const savedTransaction = await queryRunner.manager.save(transaction);

      this.logger.info(
        `PAYOUT - createTransaction - transaction: ${LoggerPlaceHolder.Json}`,
        savedTransaction,
      );

      // 5. create external payment
      const {
        orderId,
        amount,
        transferMode,
        industryType,
        beneficiaryBankName,
        beneficiaryBankAccount,
        beneficiaryBankIFSC,
        beneficiaryName,
        beneficiaryEmail,
        beneficiaryMobile,
      } = createPayoutTransactionDto;

      const payload = {
        orderId,
        amount,
        transferMode,
        industryType,
        beneDetails: {
          beneBankName: beneficiaryBankName,
          beneAccountNo: beneficiaryBankAccount,
          beneIfsc: beneficiaryBankIFSC,
          beneName: beneficiaryName,
          beneEmail: beneficiaryEmail,
          benePhone: beneficiaryMobile,
        },
      };

      this.logger.info(
        `PAYOUT - calling external (digi-payout/api/v1/external/payout/ft) API with payload: ${LoggerPlaceHolder.Json}`,
        payload,
      );

      const externalPaymentResponse =
        await this.axiosService.postRequest<IExternalPayoutPaymentResponse>(
          "digi-payout/api/v1/external/payout/ft",
          payload,
        );

      this.logger.info(
        `PAYOUT - createTransaction - externalPaymentResponse: ${LoggerPlaceHolder.Json}`,
        externalPaymentResponse,
      );

      // 6. save external payment
      const savedOrder = await queryRunner.manager.save(
        this.payOutOrdersRepository.create({
          ...savedPayoutOrder,
          transferId: externalPaymentResponse.data.transferId,
          status: externalPaymentResponse.status,
        }),
      );

      await queryRunner.commitTransaction();

      return {
        orderId: createPayoutTransactionDto.orderId,
        transferId: savedOrder.transferId,
        status: externalPaymentResponse.status,
      };

      // Commit transaction
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

  async externalWebhookPayin(externalPayinWebhookDto: ExternalPayinWebhookDto) {
    this.logger.info(
      `PAYIN WEBHOOK - externalWebhookUpdateStatusPayin - externalPayinWebhookDto: ${LoggerPlaceHolder.Json}`,
      externalPayinWebhookDto,
    );
    const {
      order_id: orderId,
      status: isSuccess,
      status_code: status,
      transaction_id: txnRefId,
    } = externalPayinWebhookDto;

    if (!isSuccess) {
      this.logger.warn(
        `PAYIN WEBHOOK - externalWebhookUpdateStatusPayin - externalPayinWebhookDto: ${JSON.stringify(externalPayinWebhookDto)}`,
      );

      throw new BadRequestException(
        new MessageResponseDto("Invalid webhook request"),
      );
    }

    const payinOrder = await this.payInOrdersRepository.findOne({
      where: {
        orderId,
        txnRefId,
      },
      relations: ["user"],
    });

    if (!payinOrder) {
      throw new NotFoundException(
        new MessageResponseDto("Payin order not found"),
      );
    }

    const { user } = payinOrder;

    const internalStatus = convertExternalPaymentStatusToInternal(status);

    const payinOrderRaw = this.payInOrdersRepository.create({
      status: internalStatus,
      ...(internalStatus === PAYMENT_STATUS.SUCCESS && {
        successAt: new Date(),
      }),
      ...(internalStatus === PAYMENT_STATUS.FAILED && {
        failureAt: new Date(),
      }),
    });

    await this.payInOrdersRepository.update(
      { id: payinOrder.id },
      payinOrderRaw,
    );

    if (user?.payInWebhookUrl) {
      const webhookPayload = {
        orderId,
        status,
        amount: payinOrder.amount,
        txnRefId: payinOrder.txnRefId,
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

  async externalWebhookPayoutBatch(
    externalPayoutWebhookDto: ExternalPayoutWebhookDto,
  ) {
    this.logger.info(
      `SETTLEMENT WEBHOOK - Got settlement webhook with payload: ${LoggerPlaceHolder.Json}`,
      externalPayoutWebhookDto,
    );
    const { orderId, status, transferId } = externalPayoutWebhookDto;

    const payoutBatch = await this.payoutBatchRepository.findOne({
      where: {
        orderId,
        transferId,
      },
    });

    if (!payoutBatch) {
      this.logger.error(
        `SETTLEMENT WEBHOOK - WRONG orderId & transferId - throwing NOT FOUND ERROR: ${LoggerPlaceHolder.Json}`,
        externalPayoutWebhookDto,
      );

      throw new NotFoundException(
        new MessageResponseDto("Payout order not found"),
      );
    }

    const payoutBatchRaw = this.payoutBatchRepository.create({
      status: convertExternalPaymentStatusToInternal(status),
      ...(status === EXTERNAL_PAYOUT_PAYMENT_STATUS.SUCCESS && {
        successAt: new Date(),
      }),
      ...(status === EXTERNAL_PAYOUT_PAYMENT_STATUS.FAILED && {
        failureAt: new Date(),
      }),
    });

    await this.payoutBatchRepository.update(
      { id: payoutBatch.id },
      payoutBatchRaw,
    );

    this.logger.info(
      `SETTLEMENT WEBHOOK - Status (${convertExternalPaymentStatusToInternal(status)}) updated successfully for settlementId: ${LoggerPlaceHolder.String}`,
      payoutBatch.id,
    );

    return new MessageResponseDto("Transaction status updated successfully.");
  }
}
