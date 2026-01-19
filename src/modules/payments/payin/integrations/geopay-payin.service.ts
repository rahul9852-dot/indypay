import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  Optional,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import {
  CreatePayinTransactionFlaPayDto,
  CreatePayinTransactionGeoPayDTO,
} from "../../dto/create-payin-payment.dto";
import { BasePayinWebhookService } from "./base-payin-webhook.service";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { WalletEntity } from "@/entities/wallet.entity";
// import { PayinWalletEntity } from "@/entities/payin-wallet.entity";
import { UsersEntity } from "@/entities/user.entity";
import { AxiosService } from "@/shared/axios/axios.service";
import { GEOPAY } from "@/constants/external-api.constant";
import { appConfig } from "@/config/app.config";
import {
  IExternalPayinPaymentResponseGeopay,
  IExternalGeoPayCheckoutResponse,
} from "@/interface/external-api.interface";
import { PAYMENT_STATUS, PAYMENT_TYPE } from "@/enums/payment.enum";
import { REDIS_KEYS } from "@/constants/redis-cache.constant";
import { getCommissions } from "@/utils/commissions.utils";
import { MessageResponseDto } from "@/dtos/common.dto";
import { LoggerPlaceHolder } from "@/logger";
import { CommissionService } from "@/modules/commissions/commission.service";

const { geopay, beBaseUrl } = appConfig();

@Injectable()
export class GeoPayPayinService extends BasePayinWebhookService {
  constructor(
    @InjectRepository(PayInOrdersEntity)
    payInOrdersRepository: Repository<PayInOrdersEntity>,
    @InjectRepository(TransactionsEntity)
    transactionsRepository: Repository<TransactionsEntity>,
    @InjectRepository(WalletEntity)
    walletRepository: Repository<WalletEntity>,
    // @InjectRepository(PayinWalletEntity)
    // payinWalletRepository: Repository<PayinWalletEntity>,
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
    createPayinTransactionDto:
      | CreatePayinTransactionFlaPayDto
      | CreatePayinTransactionGeoPayDTO,
    user: UsersEntity,
  ) {
    // GeoPay uses createGeoPayCheckout which has special handling
    return this.createGeoPayCheckout(
      createPayinTransactionDto as CreatePayinTransactionGeoPayDTO,
      user,
    );
  }

  private async createGeoPayCheckout(
    createPayinTransactionDto: CreatePayinTransactionGeoPayDTO,
    user: UsersEntity,
  ) {
    const { amount, email, mobile, name, orderId } = createPayinTransactionDto;

    if (!user) {
      this.logger.error(
        `PAYIN - createGeoPayCheckout - User is undefined. ApiKeyGuard failed to load user.`,
      );
      throw new BadRequestException("Authentication error: User not found.");
    }

    // Validation
    if (amount < 50 || amount > 50000) {
      throw new BadRequestException("Amount must be between ₹50 and ₹50,000");
    }

    // Check if order already exists
    const existingPayinOrder = await this.payInOrdersRepository.exists({
      where: { orderId },
    });
    if (existingPayinOrder) {
      throw new BadRequestException(
        "Payment order already exists for given orderId",
      );
    }

    // Call external GeoPay API to get checkout form data
    const axiosServiceGeoPay = new AxiosService(GEOPAY.BASE_URL, {
      responseType: "text",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/html,application/json,*/*",
      },
    });

    const payload: IExternalPayinPaymentResponseGeopay = {
      agentId: geopay.agentId,
      secretKey: geopay.secretKey,
      partnertxnid: orderId,
      merchantTxnAmount: String(amount),
      agentname: geopay.agentname,
      agentmobile: mobile,
      agentemail: email,
    };

    let checkoutFormData: IExternalGeoPayCheckoutResponse;
    let txnRefId: string | undefined;

    try {
      const geoPayResponse = await axiosServiceGeoPay.postRequest<any>(
        GEOPAY.PAYIN.LIVE,
        payload,
      );

      if (typeof geoPayResponse !== "string") {
        this.logger.error(
          `PAYIN - createGeoPayCheckout - Expected HTML string but got: ${typeof geoPayResponse}`,
        );
        throw new BadRequestException(
          "Unable to initiate payment. Unexpected response from payment gateway.",
        );
      }

      const htmlResponse = geoPayResponse;
      const actionUrl =
        "https://secure-axispg.freecharge.in/payment/v1/checkout";

      // Helper function to extract input value from HTML
      const extractValue = (fieldName: string): string => {
        const regex = new RegExp(
          `<input[^>]*name="${fieldName}"[^>]*value="([^"]*)"`,
          "i",
        );
        const match = htmlResponse.match(regex);

        return match ? match[1] : "";
      };

      const geoPayMerchantTxnId = extractValue("merchantTxnId");

      checkoutFormData = {
        merchantId: extractValue("merchantId") || "MERMERa7845c4",
        callbackUrl: extractValue("callbackUrl"),
        merchantTxnId: geoPayMerchantTxnId || orderId,
        merchantTxnAmount: extractValue("merchantTxnAmount") || String(amount),
        cctype: extractValue("cctype") || "HDFCAUCC",
        currency: extractValue("currency") || "INR",
        customerName: extractValue("customerName") || name,
        customerEmailId: extractValue("customerEmailId") || email,
        customerMobileNo: extractValue("customerMobileNo") || mobile,
        customerStreetAddress: extractValue("customerStreetAddress") || "N/A",
        timestamp:
          extractValue("timestamp") || String(Math.floor(Date.now() / 1000)),
        Signature: extractValue("Signature"),
        action: actionUrl,
      };

      this.logger.info(
        `CHECKOUT FORM DATA PREPARED: ${LoggerPlaceHolder.Json}`,
        checkoutFormData,
      );

      txnRefId = geoPayMerchantTxnId || orderId;
    } catch (err: any) {
      this.logger.error(
        `PAYIN - createGeoPayCheckout - Error: ${err.message || err}`,
      );
      throw new BadRequestException(
        "Failed to generate checkout page. Please try again later.",
      );
    }

    // Compute commissions
    const { commissionAmount, gstAmount, netPayableAmount } = getCommissions({
      amount,
      commissionInPercentage: user.commissionInPercentagePayin || 0,
      gstInPercentage: user.gstInPercentagePayin || 0,
    });

    // Store transaction in database
    return await this.dataSource.transaction(async (manager) => {
      // Create payin order with checkout data
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
        txnRefId,
        status: PAYMENT_STATUS.INITIATED,
        checkoutData: checkoutFormData,
      });
      const savedPayinOrder = await manager.save(payinOrder);

      // Create transaction record
      const transaction = this.transactionsRepository.create({
        user,
        payInOrder: savedPayinOrder,
        transactionType: PAYMENT_TYPE.PAYIN,
      });
      await manager.save(transaction);

      this.logger.info(`PAYIN CHECKOUT CREATED: ${LoggerPlaceHolder.Json}`, {
        orderId,
        amount,
        mobile,
        email,
      });

      // Store checkout form data in cache
      const cacheKey = `geopay:checkout:${txnRefId}`;
      await this.cacheManager.set(cacheKey, checkoutFormData, 1800);

      // Return checkout URL
      const checkoutUrl = `${beBaseUrl}/api/v1/payments/payin/geopay/checkout/${txnRefId}`;

      return {
        checkoutUrl,
        merchantTxnId: txnRefId,
        orderId,
        amount,
        status: "initiated",
        message:
          "Checkout URL created successfully. Open this URL to complete payment.",
      };
    });
  }

  async handleWebhook(webhookData: any) {
    this.logger.info(
      `GeoPay Webhook - Received: ${LoggerPlaceHolder.Json}`,
      webhookData,
    );

    const {
      merchantTxnId,
      statusMessage,
      rrn: utr,
      merchantTxnAmount,
      partnertxnid,
      amount: webhookAmount,
      payerVpa,
    } = webhookData;

    if (!merchantTxnId) {
      throw new BadRequestException("merchantTxnId is required");
    }

    // Find payin order by orderId or txnRefId
    let payinOrder = await this.findPayinOrder(undefined, partnertxnid);
    if (!payinOrder) {
      payinOrder = await this.findPayinOrder(merchantTxnId);
    }

    if (!payinOrder) {
      this.logger.error(
        `GeoPay Webhook - Payin order not found for merchantTxnId: ${merchantTxnId}`,
      );
      throw new NotFoundException(
        `Payin order not found for merchantTxnId: ${merchantTxnId}`,
      );
    }

    // Map external status to internal status
    let internalStatus: PAYMENT_STATUS;
    if (statusMessage === "SUCCESS" || statusMessage === "success") {
      internalStatus = PAYMENT_STATUS.SUCCESS;
    } else if (statusMessage === "FAILED" || statusMessage === "failed") {
      internalStatus = PAYMENT_STATUS.FAILED;
    } else if (statusMessage === "PENDING" || statusMessage === "pending") {
      internalStatus = PAYMENT_STATUS.PENDING;
    } else {
      internalStatus = PAYMENT_STATUS.FAILED;
    }

    // Skip if status hasn't changed
    if (this.isDuplicateWebhook(payinOrder, internalStatus)) {
      this.logger.info(
        `GeoPay Webhook - Duplicate webhook for order: ${merchantTxnId}`,
      );

      return new MessageResponseDto("Webhook processed successfully");
    }

    // Get the amount from webhook
    const amount = merchantTxnAmount || webhookAmount || payinOrder.amount;
    const isAmountMismatch = +payinOrder.amount !== +amount;

    const { user } = payinOrder;

    // Handle jumping count (GeoPay uses different logic - only PENDING)
    let successCount =
      +(await this.cacheManager.get(
        REDIS_KEYS.SUCCESS_COUNT(payinOrder.user.id),
      )) || 1;

    let isMisspelled = false;
    const { jumpingCount } = payinOrder.user;

    if (internalStatus === PAYMENT_STATUS.SUCCESS && jumpingCount > 0) {
      if (successCount >= jumpingCount) {
        internalStatus = PAYMENT_STATUS.PENDING;
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

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updateData: any = {
        ...(!isMisspelled && { utr }),
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
          wallet.availablePayoutBalance =
            (wallet.availablePayoutBalance
              ? +wallet.availablePayoutBalance
              : 0) + +payinOrder.netPayableAmount;
        });

        this.logger.info(
          `PAYIN WEBHOOK - Wallet updated successfully ${user.fullName}`,
        );
      }

      await queryRunner.commitTransaction();

      this.logger.info(
        `GeoPay Webhook - Order ${merchantTxnId} updated to status: ${internalStatus}`,
      );

      // Send user webhook
      await this.sendUserWebhook(user, {
        orderId: payinOrder.orderId,
        status: isAmountMismatch ? PAYMENT_STATUS.MISMATCH : internalStatus,
        amount: +amount,
        txnRefId: payinOrder.txnRefId,
        ...(!isMisspelled && { utr }),
        message: isAmountMismatch
          ? "Amount mismatch in payin order"
          : undefined,
        payerVpa,
      });

      return new MessageResponseDto("Webhook processed successfully");
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
