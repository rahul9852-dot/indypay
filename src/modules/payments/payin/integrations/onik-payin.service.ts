import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  Optional,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import * as FormData from "form-data";
import { CreatePayinTransactionFlaPayDto } from "../../dto/create-payin-payment.dto";
import { ExternalPayinWebhookOnikDto } from "../../dto/external-webhook-payin.dto";
import { BasePayinWebhookService } from "./base-payin-webhook.service";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { WalletEntity } from "@/entities/wallet.entity";
// import { PayinWalletEntity } from "@/entities/payin-wallet.entity";
import { UsersEntity } from "@/entities/user.entity";
import { AxiosService } from "@/shared/axios/axios.service";
import { ONIK } from "@/constants/external-api.constant";
import { appConfig } from "@/config/app.config";
import {
  IExternalPayinPaymentRequestOnik,
  IExternalPayinPaymentResponseOnik,
} from "@/interface/external-api.interface";
import { MessageResponseDto } from "@/dtos/common.dto";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { REDIS_KEYS } from "@/constants/redis-cache.constant";
import { getCommissions } from "@/utils/commissions.utils";
import { LoggerPlaceHolder } from "@/logger";
import { CommissionService } from "@/modules/commissions/commission.service";

const { onik } = appConfig();

@Injectable()
export class OnikPayinService extends BasePayinWebhookService {
  constructor(
    @InjectRepository(PayInOrdersEntity)
    payInOrdersRepository: Repository<PayInOrdersEntity>,
    @InjectRepository(TransactionsEntity)
    transactionsRepository: Repository<TransactionsEntity>,
    @InjectRepository(WalletEntity)
    walletRepository: Repository<WalletEntity>,
    // @InjectRepository(PayinWalletEntity)
    // payinWalletRepository: Repository<PayinWalletEntity>,
    @InjectDataSource()
    dataSource: DataSource,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    @Optional()
    @Inject(forwardRef(() => CommissionService))
    commissionService?: CommissionService,
  ) {
    super(
      payInOrdersRepository,
      transactionsRepository,
      walletRepository,
      // payinWalletRepository,
      dataSource,
      cacheManager,
      commissionService,
    );
  }

  async createPayin(
    createPayinTransactionDto: CreatePayinTransactionFlaPayDto,
    user: UsersEntity,
  ) {
    const { amount, email, mobile, name, orderId } = createPayinTransactionDto;

    if (amount < 100 || amount > 3000) {
      throw new BadRequestException(
        "Amount must be greater than 100 and less than 3000",
      );
    }

    const existingPayinOrder = await this.payInOrdersRepository.exists({
      where: { orderId },
    });
    if (existingPayinOrder) {
      throw new BadRequestException(
        "Payin order already exists for given orderId",
      );
    }

    // Call external Onik API **before starting transaction**
    const axiosServiceOnik = new AxiosService(ONIK.BASE_URL);
    const payload: IExternalPayinPaymentRequestOnik = {
      amount,
      mobile,
      name,
    };

    let paymentLink: string | undefined;
    let txnRefId: string | undefined;
    try {
      const formData = new FormData();
      formData.append("amount", String(payload.amount));
      formData.append("mobile", payload.mobile);
      formData.append("name", payload.name);

      const onikResponse =
        await axiosServiceOnik.postRequest<IExternalPayinPaymentResponseOnik>(
          ONIK.PAYIN.LIVE,
          formData,
          {
            headers: {
              "X-API-KEY": onik.apiToken,
              Accept: "application/json",
              ...formData.getHeaders(),
            },
          },
        );
      if (!onikResponse || !onikResponse.status) {
        this.logger.error(
          `PAYIN - createTransaction - Onik API failed`,
          onikResponse,
        );
        throw new BadRequestException(
          new MessageResponseDto("Something went wrong"),
        );
      }

      paymentLink = onikResponse.data?.upi_link;
      txnRefId = onikResponse.data?.txn_id;
      this.logger.info(
        `PAYIN - createTransaction - Onik API response: ${LoggerPlaceHolder.Json}`,
        onikResponse,
      );
    } catch (err: any) {
      this.logger.error(
        `PAYIN - createTransaction - Error calling Onik API`,
        err,
      );
      throw new BadRequestException("Failed to generate payment link");
    }

    // Use base class method to create order and transaction
    return this.createPayinOrderAndTransaction(
      createPayinTransactionDto,
      user,
      paymentLink,
      txnRefId,
    );
  }

  async handleWebhook(webhookData: ExternalPayinWebhookOnikDto) {
    const { status, amount, rrn, txn_id } = webhookData;

    let internalStatus = this.convertStatus(status.toUpperCase());

    const payinOrder = await this.findPayinOrder(txn_id);

    if (!payinOrder) {
      throw new NotFoundException(
        new MessageResponseDto("Payin order not found"),
      );
    }

    this.logger.info(
      `PAYIN - Webhook called - Payin order: ${LoggerPlaceHolder.Json}`,
      payinOrder.id,
    );

    if (this.isDuplicateWebhook(payinOrder, internalStatus)) {
      return {
        message: "Status updated successfully.",
        timestamp: new Date().toISOString(),
      };
    }

    // Handle jumping count
    const { status: finalStatus, isMisspelled } = await this.handleJumpingCount(
      payinOrder.user,
      internalStatus,
    );
    internalStatus = finalStatus;

    // Check for duplicate after jumping count
    if (this.isDuplicateWebhook(payinOrder, internalStatus, isMisspelled)) {
      return {
        message: "Status updated successfully.",
        timestamp: new Date().toISOString(),
      };
    }

    const { user } = payinOrder;
    const isAmountMismatch = +payinOrder.amount !== +amount;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updateData: any = {
        txnRefId: txn_id,
        ...(!isMisspelled && { utr: rrn }),
        isMisspelled,
      };

      if (isAmountMismatch) {
        const { commissionAmount, gstAmount, netPayableAmount } =
          getCommissions({
            amount: +amount,
            commissionInPercentage: user.commissionInPercentagePayin,
            gstInPercentage: user.gstInPercentagePayin,
          });

        updateData.amount = +amount;
        updateData.commissionAmount = commissionAmount;
        updateData.gstAmount = gstAmount;
        updateData.netPayableAmount = netPayableAmount;
        updateData.status = PAYMENT_STATUS.MISMATCH;
      }

      await this.updatePayinOrderStatus(
        queryRunner,
        payinOrder,
        isAmountMismatch ? PAYMENT_STATUS.MISMATCH : internalStatus,
        updateData,
      );

      // Update wallet if successful
      if (internalStatus === PAYMENT_STATUS.SUCCESS && !isAmountMismatch) {
        await this.cacheManager.del(
          REDIS_KEYS.PAYMENT_STATUS(payinOrder.orderId),
        );

        await this.safeUpdateWalletBalance(queryRunner, user.id, (wallet) => {
          wallet.totalCollections =
            (wallet.totalCollections ? +wallet.totalCollections : 0) + +amount;
        });

        this.logger.info(
          `PAYIN WEBHOOK - Wallet updated successfully ${user.fullName}`,
        );
      }

      await queryRunner.commitTransaction();

      // Send user webhook OUTSIDE transaction to reduce transaction duration
      // Use setImmediate to not block the response
      setImmediate(() => {
        this.sendUserWebhook(user, {
          orderId: payinOrder.orderId,
          status: isAmountMismatch ? PAYMENT_STATUS.MISMATCH : internalStatus,
          amount: +amount,
          txnRefId: payinOrder.txnRefId,
          ...(!isMisspelled && { utr: rrn }),
          message: isAmountMismatch
            ? "Amount mismatch in payin order"
            : undefined,
        }).catch((err) => {
          // Log but don't throw - webhook failures shouldn't affect response
          this.logger.error(
            `Failed to send user webhook for order ${payinOrder.orderId}`,
            err,
          );
        });
      });

      return {
        message: "Transaction status updated successfully.",
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
