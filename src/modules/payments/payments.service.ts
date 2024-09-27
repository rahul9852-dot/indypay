import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import axios from "axios";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { CreateTransactionDto } from "./dto/create-payment.dto";
import { ExternalPayinWebhookDto } from "./dto/external-webhook.dto";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { MessageResponseDto } from "@/dtos/common.dto";
import { PAYMENT_STATUS, PAYMENT_TYPE } from "@/enums/payment.enum";
import { UsersEntity } from "@/entities/user.entity";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import { IExternalPaymentResponse } from "@/interface/external-api.interface";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";
import { AxiosService } from "@/shared/axios/axios.service";
import { appConfig } from "@/config/app.config";
import { generateQrCode } from "@/utils/upiqr.util";

const {
  externalPaymentConfig: { baseUrl, clientId, clientSecret },
} = appConfig();

@Injectable()
export class PaymentsService {
  private readonly logger = new CustomLogger(PaymentsService.name);
  private readonly axiosService = new AxiosService(baseUrl, {
    headers: {
      "Content-Type": "application/json",
      "client-id": clientId,
      "secret-key": clientSecret,
    },
  });
  constructor(
    @InjectRepository(TransactionsEntity)
    private readonly transactionsRepository: Repository<TransactionsEntity>,
    @InjectRepository(PayInOrdersEntity)
    private readonly payInOrdersRepository: Repository<PayInOrdersEntity>,
    @InjectRepository(PayOutOrdersEntity)
    private readonly payOutOrdersRepository: Repository<PayOutOrdersEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
    user: UsersEntity,
    type: PAYMENT_TYPE,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();

    // Start transaction
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (type === PAYMENT_TYPE.PAYIN) {
        const existingOrder = await this.payInOrdersRepository.exists({
          where: {
            orderId: createTransactionDto.orderId,
          },
        });

        if (existingOrder) {
          throw new BadRequestException(
            new MessageResponseDto(
              "Order id already exists. Please with different order id.",
            ),
          );
        }
        // 1. create pay-in order
        const payinOrder = this.payInOrdersRepository.create({
          user,
          ...createTransactionDto,
        });

        // 2. save pay-in order
        const savedPayinOrder = await queryRunner.manager.save(payinOrder);

        // 3. create transaction
        const transaction = this.transactionsRepository.create({
          user,
          payInOrder: savedPayinOrder,
          transactionType: type,
        });

        // 4. save transaction
        const savedTransaction = await queryRunner.manager.save(transaction);

        this.logger.info(
          `createTransaction - transaction: ${LoggerPlaceHolder.Json}`,
          savedTransaction,
        );

        // 5. create external payment
        const payload = createTransactionDto;

        this.logger.info(
          `calling external (payin/ext/txn/initiate-intent) API with payload: ${LoggerPlaceHolder.Json}`,
          payload,
        );

        const externalPaymentResponse =
          await this.axiosService.postRequest<IExternalPaymentResponse>(
            "payin/ext/txn/initiate-intent",
            payload,
          );

        this.logger.info(
          `createTransaction - externalPaymentResponse: ${LoggerPlaceHolder.Json}`,
          externalPaymentResponse,
        );

        // 6. save external payment
        const savedOrder = await queryRunner.manager.save(
          this.payInOrdersRepository.create({
            ...savedPayinOrder,
            txnRefId: externalPaymentResponse.data.txnRefId,
            paymentUrl: externalPaymentResponse.data.paymentUrl,
          }),
        );

        await queryRunner.commitTransaction();

        const qr = await generateQrCode(savedOrder.paymentUrl);

        return {
          orderId: createTransactionDto.orderId,
          txnRefId: savedOrder.txnRefId,
          paymentUrl: savedOrder.paymentUrl,
          qr,
        };
      } else if (type === PAYMENT_TYPE.PAYOUT) {
        // TODO: PayOuts
      }

      // Commit transaction
    } catch (err: any) {
      // Rollback transaction if any operation fails
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err.message);
    } finally {
      // Release the queryRunner to avoid memory leaks
      await queryRunner.release();
    }
  }

  async checkPayInStatusTransaction(orderId: string) {
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

  async findAllTransactions() {
    return this.transactionsRepository.find();
  }

  async findTransaction(id: string) {
    return this.transactionsRepository.findOne({ where: { id } });
  }

  async externalPayinWebhookUpdateStatus(
    externalPayinWebhookDto: ExternalPayinWebhookDto,
  ) {
    this.logger.info(
      `externalPayinWebhookUpdateStatus - externalPayinWebhookDto: ${LoggerPlaceHolder.Json}`,
      externalPayinWebhookDto,
    );
    const { orderId, status } = externalPayinWebhookDto;

    const payinOrder = await this.payInOrdersRepository.findOne({
      where: {
        orderId: externalPayinWebhookDto.orderId,
        txnRefId: externalPayinWebhookDto.transactionRefId,
      },
      relations: ["user"],
    });

    if (!payinOrder) {
      throw new NotFoundException(
        new MessageResponseDto("Payin order not found"),
      );
    }

    const { user } = payinOrder;

    const payinOrderRaw = this.payInOrdersRepository.create({
      status,
      ...(status === PAYMENT_STATUS.SUCCESS && {
        successAt: new Date(),
      }),
      ...(status === PAYMENT_STATUS.FAILED && {
        failureAt: new Date(),
      }),
    });

    await this.payInOrdersRepository.update(
      { id: payinOrder.id },
      payinOrderRaw,
    );

    if (user?.payInWebhookUrl) {
      axios
        .post(
          user.payInWebhookUrl,
          {
            orderId,
            status,
            amount: payinOrder.amount,
            txnRefId: payinOrder.txnRefId,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        )
        .catch((err) => {
          this.logger.error(
            `externalPayinWebhookUpdateStatus - error while sending webhook to user: ${LoggerPlaceHolder.Json}`,
            err,
          );
        });
    }

    return new MessageResponseDto("Transaction status updated successfully.");
  }
}
