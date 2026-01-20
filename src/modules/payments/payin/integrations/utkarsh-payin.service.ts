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
import { CreatePayinTransactionFlaPayDto } from "../../dto/create-payin-payment.dto";
import { ExternalPayinWebhookUtkarshDto } from "../../dto/external-webhook-payin.dto";
import { BasePayinWebhookService } from "./base-payin-webhook.service";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { WalletEntity } from "@/entities/wallet.entity";
// import { PayinWalletEntity } from "@/entities/payin-wallet.entity";
import { UsersEntity } from "@/entities/user.entity";
import { generatePaymentLinkUtil } from "@/utils/payment-link.util";
import { appConfig } from "@/config/app.config";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { REDIS_KEYS } from "@/constants/redis-cache.constant";
import { getCommissions } from "@/utils/commissions.utils";
import { MessageResponseDto } from "@/dtos/common.dto";
import { LoggerPlaceHolder } from "@/logger";
import { CommissionService } from "@/modules/commissions/commission.service";

const {
  utkarsh: { vpa },
} = appConfig();

@Injectable()
export class UtkarshPayinService extends BasePayinWebhookService {
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

    const paymentLink = generatePaymentLinkUtil({
      amount,
      orderId,
      vpa,
    });

    // Use base class method to create order and transaction
    return this.createPayinOrderAndTransaction(
      createPayinTransactionDto,
      user,
      paymentLink,
    );
  }

  async handleWebhook(webhookData: ExternalPayinWebhookUtkarshDto) {
    const { txnId, txnStatus, custRef, amount, refId, payerVpa } = webhookData;

    let status = this.convertStatus(txnStatus);

    // Utkarsh uses orderId (refId) to find the order
    const payinOrder = await this.findPayinOrder(undefined, refId);

    if (!payinOrder) {
      throw new NotFoundException(
        new MessageResponseDto("Payin order not found"),
      );
    }

    this.logger.info(
      `PAYIN - Webhook called - Payin order: ${LoggerPlaceHolder.Json}`,
      payinOrder.id,
    );

    if (this.isDuplicateWebhook(payinOrder, status)) {
      return {
        message: "Status updated successfully.",
        timestamp: new Date().toISOString(),
      };
    }

    // Handle jumping count
    const { status: finalStatus, isMisspelled } = await this.handleJumpingCount(
      payinOrder.user,
      status,
    );
    status = finalStatus;

    // Check for duplicate after jumping count
    if (this.isDuplicateWebhook(payinOrder, status, isMisspelled)) {
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
        txnRefId: txnId,
        ...(!isMisspelled && { utr: custRef }),
        isMisspelled,
      };

      if (isAmountMismatch) {
        const { commissionAmount, gstAmount, netPayableAmount } =
          getCommissions({
            amount,
            commissionInPercentage: user.commissionInPercentagePayin,
            gstInPercentage: user.gstInPercentagePayin,
          });

        updateData.amount = amount;
        updateData.commissionAmount = commissionAmount;
        updateData.gstAmount = gstAmount;
        updateData.netPayableAmount = netPayableAmount;
        updateData.status = PAYMENT_STATUS.MISMATCH;
      }

      await this.updatePayinOrderStatus(
        queryRunner,
        payinOrder,
        isAmountMismatch ? PAYMENT_STATUS.MISMATCH : status,
        updateData,
      );

      // Update wallet if successful
      if (status === PAYMENT_STATUS.SUCCESS && !isAmountMismatch) {
        await this.cacheManager.del(
          REDIS_KEYS.PAYMENT_STATUS(payinOrder.orderId),
        );

        await this.safeUpdateWalletBalance(queryRunner, user.id, (wallet) => {
          wallet.totalCollections =
            (wallet.totalCollections ? +wallet.totalCollections : 0) + +amount;
        });

        // await this.safeUpdatePayinWalletBalance(queryRunner, user.id, (wallet) => {
        //   wallet.totalPayinBalance =
        //     (wallet.totalPayinBalance ? +wallet.totalPayinBalance : 0) -
        //     (+payinOrder.amount - +payinOrder.netPayableAmount);
        // });

        this.logger.info(
          `PAYIN WEBHOOK - Wallet updated successfully ${user.fullName}`,
        );
      }

      await queryRunner.commitTransaction();

      // Send user webhook
      await this.sendUserWebhook(user, {
        orderId: payinOrder.orderId,
        status: isAmountMismatch ? PAYMENT_STATUS.MISMATCH : status,
        amount: +amount,
        txnRefId: payinOrder.txnRefId,
        ...(!isMisspelled && { utr: custRef }),
        payerVpa,
        message: isAmountMismatch
          ? "Amount mismatch in payin order"
          : "Not paid on same orderId",
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
