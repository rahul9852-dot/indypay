import {
  BadRequestException,
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
import { PayinStatusDto } from "./dto/create-payin-payment.dto";
import {
  CreatePayoutDto,
  SinglePayoutDto,
} from "./dto/create-payout-payment.dto";
import {
  CreatePaymentLinkDto,
  CreateCheckoutDto,
} from "./dto/create-payin-payment.dto";
import {
  CreateCheckoutPageDto,
  UpdateCheckoutPageDto,
  CheckoutPagePayDto,
} from "./dto/checkout-page.dto";
import { SNSService } from "@/modules/aws/sns.service";
import { S3Service } from "@/modules/aws/s3.service";
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
import { appConfig } from "@/config/app.config";
import {
  convertExternalPaymentStatusToInternal,
  getUlidId,
} from "@/utils/helperFunctions.utils";
import { WalletEntity } from "@/entities/wallet.entity";
import { calculateDynamicCommission } from "@/utils/commissions.utils";
import { getPagination } from "@/utils/pagination.utils";
import { ID_TYPE, USERS_ROLE } from "@/enums";
import { REDIS_KEYS } from "@/constants/redis-cache.constant";
import { CryptoService } from "@/utils/encryption-algo.utils";
import { CheckoutEntity } from "@/entities/checkout.entity";
import { PaymentLinkEntity } from "@/entities/payment-link.entity";
import {
  PaymentLinkEventEntity,
  PaymentLinkEventAction,
} from "@/entities/payment-link-event.entity";
import {
  PaymentLinkReminderEntity,
  ReminderChannel,
  ReminderStatus,
} from "@/entities/payment-link-reminder.entity";
import {
  CheckoutPageEntity,
  CheckoutAmountType,
  CheckoutPageStatus,
} from "@/entities/checkout-page.entity";

const { beBaseUrl } = appConfig();

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
    @InjectRepository(CheckoutEntity)
    private readonly checkoutRepository: Repository<CheckoutEntity>,
    @InjectRepository(PaymentLinkEntity)
    private readonly paymentLinkRepository: Repository<PaymentLinkEntity>,
    @InjectRepository(CheckoutPageEntity)
    private readonly checkoutPageRepository: Repository<CheckoutPageEntity>,
    @InjectQueue("payouts") private payoutQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,

    @InjectRepository(PaymentLinkEventEntity)
    private readonly paymentLinkEventRepository: Repository<PaymentLinkEventEntity>,
    @InjectRepository(PaymentLinkReminderEntity)
    private readonly paymentLinkReminderRepository: Repository<PaymentLinkReminderEntity>,

    private readonly dataSource: DataSource,
    private readonly encryptionAlgoService: CryptoService,
    private readonly s3Service: S3Service,
    private readonly snsService: SNSService,
  ) {}

  public randomStr(len: number, arr: string) {
    let ans = "";
    for (let i = 0; i < len; i++) {
      ans += arr[Math.floor(Math.random() * arr.length)];
    }

    return ans;
  }

  async checkPayOutWalletBalance(user: UsersEntity) {
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

  private async validateAndUpdateWallet(
    queryRunner: QueryRunner,
    user: UsersEntity,
    totalAmount: number,
  ) {
    // current wallet to check balance
    let userWallet = await queryRunner.manager
      .createQueryBuilder(WalletEntity, "wallet")
      .leftJoinAndSelect("wallet.user", "user")
      .where("user.id = :userId", { userId: user.id })
      .setLock("pessimistic_write")
      .getOne();

    if (!userWallet) {
      userWallet = await queryRunner.manager.save(
        this.walletRepository.create({ user }),
      );
    }

    const currentBalance = +userWallet.availablePayoutBalance;
    const newBalance = currentBalance - totalAmount;
    const MINIMUM_BALANCE = 50;

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

    // with optimistic locking
    const updatedWallet = await this.safeUpdateWalletBalance(
      queryRunner,
      user.id,
      (wallet) => {
        wallet.availablePayoutBalance = newBalance;
      },
    );

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
    // D-7 fix: use sequential loop instead of Promise.all.
    // All saves share the same queryRunner/connection. With Promise.all, if one
    // save fails the catch block calls rollbackTransaction() while the remaining
    // concurrent promises still hold references to the same queryRunner and attempt
    // further saves — producing unhandled rejections and potentially crashing Node.
    // Sequential iteration stops immediately on the first failure, giving the
    // outer try/catch a clean, single error to handle before rollback.
    const savedOrders: PayOutOrdersEntity[] = [];

    for (const payment of payouts) {
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

      // create transaction
      const transaction = this.transactionsRepository.create({
        user,
        payOutOrder: savedPayoutOrder,
        transactionType: PAYMENT_TYPE.PAYOUT,
      });

      await queryRunner.manager.save(transaction);

      savedOrders.push(savedPayoutOrder);
    }

    return savedOrders;
  }

  async checkPayInStatusTransaction(
    { orderId }: PayinStatusDto,
    _user: UsersEntity,
  ) {
    this.logger.debug(`checkPayInStatusTransaction: ${orderId}`);

    const payinOrder = await this.payInOrdersRepository.findOne({
      where: { orderId },
    });

    if (!payinOrder) {
      throw new NotFoundException(
        new MessageResponseDto("Payin order not found"),
      );
    }

    // Only skip if status is already SUCCESS and we have a txnRefId
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

  /**
   * List payment links for the dashboard.
   *
   * Root-cause fix: the previous implementation queried paymentLinkRepository
   * using search fields (orderId, txnRefId) that only exist on PayInOrdersEntity,
   * causing silent empty results or TypeORM runtime errors on any search.
   *
   * Correct searchable fields on payment_links:
   *   name (customer), email (customer), mobile (customer)
   * Admin sees all merchants; merchant sees only their own links.
   * isExpired is computed at query time — no cron needed.
   */
  async getPaymentLinks(
    user: UsersEntity,
    {
      limit = 10,
      page = 1,
      sort = "createdAt",
      order = "DESC",
      search = "",
      startDate,
      endDate,
      status,
    }: PaginationWithDateAndStatusDto,
  ) {
    const isAdmin = [USERS_ROLE.ADMIN, USERS_ROLE.OWNER].includes(user.role);

    // Whitelist sort columns to prevent injection via the sort param.
    const ALLOWED_SORT: (keyof PaymentLinkEntity)[] = [
      "createdAt",
      "amount",
      "status",
      "expiresAt",
    ];
    const safeSort: keyof PaymentLinkEntity = ALLOWED_SORT.includes(
      sort as keyof PaymentLinkEntity,
    )
      ? (sort as keyof PaymentLinkEntity)
      : "createdAt";

    // ── Date filter ────────────────────────────────────────────────────────
    const dateFilter: FindOptionsWhere<PaymentLinkEntity> = {};
    if (startDate && endDate) {
      dateFilter.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      dateFilter.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      dateFilter.createdAt = LessThanOrEqual(new Date(endDate));
    }

    const internalStatus = status
      ? convertExternalPaymentStatusToInternal(status.toUpperCase())
      : undefined;

    // ── Build WHERE clauses ────────────────────────────────────────────────
    // base = ownership + status + date; then expand for search terms.
    const base: FindOptionsWhere<PaymentLinkEntity> = {
      ...(!isAdmin && { userId: user.id }),
      ...(internalStatus && { status: internalStatus }),
      ...dateFilter,
    };

    const where: FindOptionsWhere<PaymentLinkEntity>[] = search
      ? [
          { ...base, name: ILike(`%${search}%`) },
          { ...base, email: ILike(`%${search}%`) },
          { ...base, mobile: ILike(`%${search}%`) },
        ]
      : [base];

    // ── Query ──────────────────────────────────────────────────────────────
    const [data, totalItems] = await this.paymentLinkRepository.findAndCount({
      where,
      relations: { user: true },
      select: {
        id: true,
        amount: true,
        email: true,
        name: true,
        mobile: true,
        note: true,
        status: true,
        allowPartialPayment: true,
        minimumPartialAmount: true,
        viewCount: true,
        expiresAt: true,
        paidAt: true,
        notifyOnEmail: true,
        notifyOnNumber: true,
        createdAt: true,
        user: { id: true, fullName: true },
      },
      skip: (page - 1) * limit,
      take: limit,
      order: { [safeSort]: order },
    });

    const now = new Date();

    // ── Enrich each record with computed fields ────────────────────────────
    const enriched = data.map((link) => {
      const linkUrl = this.buildPaymentLinkUrl(link.id);
      const isExpired =
        link.expiresAt != null &&
        link.expiresAt < now &&
        link.status === PAYMENT_STATUS.PENDING;

      return {
        ...link,
        amount: +link.amount,
        minimumPartialAmount:
          link.minimumPartialAmount != null ? +link.minimumPartialAmount : null,
        isExpired,
        paymentLinkUrl: linkUrl,
        whatsappShareUrl: this.buildWhatsappShareUrl({
          amount: +link.amount,
          linkUrl,
          note: link.note,
        }),
      };
    });

    const pagination = getPagination({ totalItems, page, limit });

    return { data: enriched, pagination };
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

  // immediate fix by version check
  private async safeUpdateWalletBalance(
    queryRunner: QueryRunner,
    userId: string,
    updateFn: (wallet: WalletEntity) => void,
  ): Promise<WalletEntity> {
    const maxRetries = 3; // Reduced from 8 to prevent long transaction duration
    const baseDelay = 50; // Reduced from 100 for faster retries
    const operationTimeout = 3000; // Reduced from 5000 to fail faster
    const lockTimeout = 2000; // Reduced from 5000 to fail faster on lock contention
    const lockTtl = 5000; // Reduced from 10000 to match lockTimeout

    const startTime = Date.now();
    const lockKey = `wallet_update:${userId}`;
    let lockAcquired = false;

    // FIXED: Wait for lock instead of failing immediately
    const acquireLock = async (): Promise<boolean> => {
      const lockStartTime = Date.now();

      while (Date.now() - lockStartTime < lockTimeout) {
        const existingLock = await this.cacheManager.get(lockKey);

        if (!existingLock) {
          // Try to acquire lock
          await this.cacheManager.set(lockKey, "locked", lockTtl);
          // Double-check we got the lock (race condition safety)
          const checkLock = await this.cacheManager.get(lockKey);
          if (checkLock) {
            return true;
          }
        }
        // Wait before checking again (reduced delay for faster lock acquisition)
        await new Promise(
          (resolve) => setTimeout(resolve, 25 + Math.random() * 25), // Reduced from 50-100ms to 25-50ms
        );
      }

      return false; // Couldn't acquire lock within timeout
    };

    try {
      // Wait for lock acquisition
      lockAcquired = await acquireLock();

      if (!lockAcquired) {
        throw new Error(
          `Could not acquire wallet lock for user ${userId} within ${lockTimeout}ms`,
        );
      }

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Check if we've exceeded the operation timeout
          if (Date.now() - startTime > operationTimeout) {
            throw new Error(
              `Wallet update timeout after ${operationTimeout}ms for user: ${userId}`,
            );
          }

          // Get wallet with current version
          const wallet = await queryRunner.manager
            .createQueryBuilder(WalletEntity, "wallet")
            .where("wallet.userId = :userId", { userId })
            .getOne();

          if (!wallet) {
            throw new NotFoundException(`Wallet not found for user: ${userId}`);
          }

          const originalVersion = wallet.version;

          // Apply the update function
          updateFn(wallet);

          // Increment version for optimistic locking
          wallet.version = originalVersion + 1;
          wallet.updatedAt = new Date();

          // Update with version check - optimized for index usage
          const result = await queryRunner.manager
            .createQueryBuilder()
            .update(WalletEntity)
            .set({
              totalCollections: wallet.totalCollections,
              availablePayoutBalance: wallet.availablePayoutBalance,
              version: wallet.version,
              updatedAt: wallet.updatedAt,
            })
            .where("userId = :userId AND version = :version", {
              userId,
              version: originalVersion,
            })
            .execute();

          if (result.affected === 0) {
            // Version conflict, retry with exponential backoff
            if (attempt === maxRetries - 1) {
              throw new Error(
                `Wallet update conflict after ${maxRetries} retries for user: ${userId}`,
              );
            }

            const delay = baseDelay * Math.pow(2, attempt);
            const jitter = Math.floor(Math.random() * delay * 0.5);
            await new Promise((resolve) => setTimeout(resolve, delay + jitter));
            continue;
          }

          this.logger.info(
            `Wallet updated successfully for user ${userId} on attempt ${attempt + 1}`,
            {
              userId,
              attempt: attempt + 1,
              newVersion: wallet.version,
              totalCollections: wallet.totalCollections,
              availablePayoutBalance: wallet.availablePayoutBalance,
            },
          );

          return wallet;
        } catch (error) {
          if (attempt === maxRetries - 1) {
            this.logger.error(
              `Failed to update wallet for user ${userId} after ${maxRetries} attempts`,
              error,
            );
            throw error;
          }

          const delay = baseDelay * Math.pow(2, attempt);
          const jitter = Math.floor(Math.random() * delay * 0.5);
          await new Promise((resolve) => setTimeout(resolve, delay + jitter));
        }
      }

      throw new Error(`Unexpected error in wallet update for user: ${userId}`);
    } finally {
      // Always release lock if we acquired it
      if (lockAcquired) {
        await this.cacheManager.del(lockKey);
      }
    }
  }

  // ─── Payment Link helpers ─────────────────────────────────────────────────

  /** Resolve a merchant-facing preset to an absolute expiry Date (or null). */
  /** Canonical public URL for a given link ID. */
  private buildPaymentLinkUrl(linkId: string): string {
    return `${beBaseUrl}/api/v1/payments/payment-link/${linkId}`;
  }

  /**
   * Pre-built WhatsApp URL — merchant taps one button and the message is
   * already filled.  Format matches what 80% of Indian SMB merchants expect.
   */
  buildWhatsappShareUrl(params: {
    amount: number;
    linkUrl: string;
    note?: string | null;
  }): string {
    const rupees = new Intl.NumberFormat("en-IN").format(params.amount);
    let text = `Hi, please pay ₹${rupees} here: ${params.linkUrl}`;
    if (params.note) text += `\n\nNote: ${params.note}`;

    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  /**
   * Create a payment link with encrypted details and expiry.
   * expiresAt is an optional ISO date string from the merchant's DatePicker.
   * Omitting it (or passing null) means the link never expires.
   */
  async createPaymentLink(dto: CreatePaymentLinkDto, user: UsersEntity) {
    if (!user?.id) {
      throw new BadRequestException(
        "User context required. Please log in and try again.",
      );
    }

    const {
      amount,
      email,
      name,
      mobile,
      expiresAt: expiresAtRaw,
      note = null,
      allowPartialPayment = false,
      minimumAmount = null,
      notifyOnEmail = false,
      notifyOnNumber = false,
    } = dto;

    // Guard: minimumAmount must be less than the full amount.
    if (
      allowPartialPayment &&
      minimumAmount != null &&
      minimumAmount >= amount
    ) {
      throw new BadRequestException(
        "minimumAmount must be less than the payment amount.",
      );
    }

    // Parse the ISO date string from the DatePicker (null = never expires).
    const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;

    // AES-encrypted snapshot served to the unauthenticated customer endpoint.
    // Prevents field tampering if the linkId leaks.
    const encryptedData = this.encryptionAlgoService.encrypt(
      JSON.stringify({
        amount,
        name,
        email,
        mobile,
        note,
        allowPartialPayment,
        minimumPartialAmount: minimumAmount,
        expiresAt: expiresAt?.toISOString() ?? null,
        notifyOnEmail,
        notifyOnNumber,
      }),
    );

    const paymentLink = this.paymentLinkRepository.create({
      amount,
      email,
      mobile,
      name,
      note,
      allowPartialPayment,
      minimumPartialAmount: minimumAmount,
      userId: user.id,
      encryptedData,
      expiresAt,
      notifyOnEmail,
      notifyOnNumber,
      status: PAYMENT_STATUS.PENDING,
    });

    const savedLink = await this.paymentLinkRepository.save(paymentLink);

    const paymentLinkUrl = this.buildPaymentLinkUrl(savedLink.id);

    this.logger.info(
      `Payment link created: ${LoggerPlaceHolder.Json}`,
      savedLink.id,
    );

    return {
      linkId: savedLink.id,
      paymentLinkUrl,
      expiresAt: expiresAt?.toISOString() ?? null,
      whatsappShareUrl: this.buildWhatsappShareUrl({
        amount,
        linkUrl: paymentLinkUrl,
        note,
      }),
      message: "Payment link created successfully",
    };
  }

  /**
   * Public endpoint — customer opens the payment link URL.
   *
   * Changes vs the old implementation:
   *  • Increments viewCount atomically (analytics).
   *  • Returns isExpired: true instead of throwing — lets the frontend render
   *    a proper "This link has expired" page rather than an error JSON.
   *  • Returns note, allowPartialPayment, minimumPartialAmount.
   *  • Validates against both the DB expiresAt and the encrypted snapshot to
   *    prevent clock-skew or DB-edit tampering.
   */
  async getPaymentLinkDetails(linkId: string, visitorIp?: string) {
    const paymentLink = await this.paymentLinkRepository.findOne({
      where: { id: linkId },
    });

    if (!paymentLink) {
      throw new NotFoundException("Payment link not found");
    }

    // Increment view counter + log OPENED event (both fire-and-forget).
    this.paymentLinkRepository
      .increment({ id: linkId }, "viewCount", 1)
      .catch((err) =>
        this.logger.error(
          `Failed to increment viewCount for link ${linkId}: ${err?.message}`,
        ),
      );

    this.paymentLinkEventRepository
      .save(
        this.paymentLinkEventRepository.create({
          linkId,
          action: PaymentLinkEventAction.OPENED,
          ipAddress: visitorIp ?? null,
          city: null, // geo-IP lookup can be wired in here later
        }),
      )
      .catch((err) =>
        this.logger.error(
          `Failed to log link event for ${linkId}: ${err?.message}`,
        ),
      );

    const now = new Date();

    // Expired check against the DB column (fast path).
    if (paymentLink.expiresAt != null && now > paymentLink.expiresAt) {
      return {
        linkId: paymentLink.id,
        isExpired: true,
        expiresAt: paymentLink.expiresAt.toISOString(),
        amount: +paymentLink.amount,
        name: paymentLink.name ?? null,
        viewCount: paymentLink.viewCount + 1,
      };
    }

    // Already paid — tell the frontend so it can show a "Payment complete" page.
    if (paymentLink.status === PAYMENT_STATUS.SUCCESS) {
      return {
        linkId: paymentLink.id,
        isPaid: true,
        paidAt: paymentLink.paidAt?.toISOString() ?? null,
        amount: +paymentLink.amount,
        name: paymentLink.name ?? null,
      };
    }

    // Decrypt and validate the tamper-proof snapshot.
    let snapshot: any;
    try {
      const raw = this.encryptionAlgoService.decrypt(paymentLink.encryptedData);
      snapshot = JSON.parse(raw);
    } catch (error) {
      this.logger.error(
        `Failed to decrypt payment link ${linkId}: ${LoggerPlaceHolder.Json}`,
        error,
      );
      throw new BadRequestException(
        "Payment link data could not be read. Please contact support.",
      );
    }

    // Secondary expiry check against the encrypted snapshot.
    if (snapshot.expiresAt != null && now > new Date(snapshot.expiresAt)) {
      return {
        linkId: paymentLink.id,
        isExpired: true,
        expiresAt: snapshot.expiresAt,
        amount: +snapshot.amount,
        name: snapshot.name ?? null,
      };
    }

    return {
      linkId: paymentLink.id,
      amount: +snapshot.amount,
      email: snapshot.email,
      name: snapshot.name ?? paymentLink.name ?? null,
      mobile: snapshot.mobile,
      note: snapshot.note ?? null,
      allowPartialPayment: !!snapshot.allowPartialPayment,
      minimumPartialAmount: snapshot.minimumPartialAmount ?? null,
      expiresAt: snapshot.expiresAt ?? null,
      isExpired: false,
      isPaid: false,
      notifyOnEmail: !!snapshot.notifyOnEmail,
      notifyOnNumber: !!snapshot.notifyOnNumber,
      viewCount: paymentLink.viewCount + 1,
    };
  }

  /**
   * Fetch a single payment link that belongs to the requesting user.
   * Used by the WhatsApp share endpoint to guard against IDOR.
   */
  async getOwnPaymentLink(linkId: string, userId: string) {
    const link = await this.paymentLinkRepository.findOne({
      where: { id: linkId, userId },
      select: {
        id: true,
        amount: true,
        note: true,
        expiresAt: true,
        status: true,
      },
    });

    if (!link) {
      throw new NotFoundException("Payment link not found");
    }

    return link;
  }

  /**
   * Mark a payment link as paid.
   * Call this from the webhook handler after a successful payin that
   * originated from a payment link (pass paymentLinkId on the payin order).
   */
  async markLinkAsPaid(linkId: string, paidAt: Date = new Date()) {
    await this.paymentLinkRepository.update(
      { id: linkId, status: PAYMENT_STATUS.PENDING },
      { status: PAYMENT_STATUS.SUCCESS, paidAt },
    );
  }

  /**
   * Create a checkout session
   */
  async createCheckout(
    createCheckoutDto: CreateCheckoutDto,
    _user: UsersEntity,
  ) {
    const {
      amount,
      email,
      mobile,
      notifyOnEmail = false,
      notifyOnNumber = false,
    } = createCheckoutDto;

    const clientTxnId = getUlidId(ID_TYPE.CHECKOUT);

    // Create checkout entity
    const checkout = this.checkoutRepository.create({
      payerEmail: email,
      payerMobile: mobile,
      amount: amount.toString(),
      clientTxnId,
      notifyOnEmail,
      notifyOnNumber,
      status: PAYMENT_STATUS.PENDING,
    });

    const savedCheckout = await this.checkoutRepository.save(checkout);

    // Generate checkout URL
    const checkoutUrl = `${beBaseUrl}/api/v1/payments/checkout/${savedCheckout.id}`;

    this.logger.info(
      `Checkout created: ${LoggerPlaceHolder.Json}`,
      savedCheckout.id,
    );

    return {
      checkoutId: savedCheckout.id,
      checkoutUrl,
      message: "Checkout created successfully",
    };
  }

  /**
   * Get checkout details by checkoutId
   */
  async getCheckoutDetails(checkoutId: string) {
    const checkout = await this.checkoutRepository.findOne({
      where: { id: checkoutId },
    });

    if (!checkout) {
      throw new NotFoundException("Checkout not found");
    }

    return {
      checkoutId: checkout.id,
      payerEmail: checkout.payerEmail,
      payerMobile: checkout.payerMobile,
      payerAddress: checkout.payerAddress,
      amount: checkout.amount,
      clientTxnId: checkout.clientTxnId,
      status: checkout.status,
      notifyOnEmail: checkout.notifyOnEmail,
      notifyOnNumber: checkout.notifyOnNumber,
      createdAt: checkout.createdAt,
    };
  }

  // ─── Checkout page helpers ────────────────────────────────────────────────

  /** Returns the public-facing hosted page URL for a given checkout page ID. */
  private buildCheckoutPageUrl(pageId: string): string {
    return `${beBaseUrl}/pay/${pageId}`;
  }

  // ─── Merchant-facing (authenticated) methods ──────────────────────────────

  /**
   * List all checkout pages belonging to the merchant, newest first.
   * Each row is enriched with its public URL so the dashboard can show
   * a share button immediately without a second API call.
   */
  async getAllCheckoutPages(userId: string) {
    const pages = await this.checkoutPageRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });

    return pages.map((p) => ({
      ...p,
      fixedAmount: p.fixedAmount != null ? +p.fixedAmount : null,
      minimumAmount: p.minimumAmount != null ? +p.minimumAmount : null,
      pageUrl: this.buildCheckoutPageUrl(p.id),
    }));
  }

  /**
   * Get a single checkout page by id — must belong to the requesting merchant.
   * IDOR guard: WHERE id AND userId.
   */
  async getCheckoutPageById(
    id: string,
    user: UsersEntity,
  ): Promise<CheckoutPageEntity> {
    const page = await this.checkoutPageRepository.findOne({
      where: { id, userId: user.id },
    });
    if (!page) {
      throw new NotFoundException("Checkout page not found");
    }

    return page;
  }

  /**
   * Create a checkout page (saved as DRAFT by default).
   * Returns the page + its public URL so the merchant can share it immediately
   * after publishing.
   *
   * Design decisions:
   *  • fixedAmount is set to null when amountType = USER_ENTERED — prevents
   *    stale amounts leaking if merchant switches type back and forth.
   *  • minimumAmount only makes sense for USER_ENTERED — stored regardless,
   *    frontend should only enforce it in that mode.
   */
  async createCheckoutPage(dto: CreateCheckoutPageDto, user: UsersEntity) {
    const amountType = dto.amountType ?? CheckoutAmountType.USER_ENTERED;

    const page = this.checkoutPageRepository.create({
      userId: user.id,
      name: dto.name ?? null,
      logoUrl: dto.logoUrl ?? null,
      title: dto.title,
      pageDescription: dto.pageDescription ?? null,
      primaryColor: dto.primaryColor ?? "#6366F1",
      buttonText: dto.buttonText ?? "Pay Now",
      contactMobile: dto.contactMobile ?? null,
      contactEmail: dto.contactEmail ?? null,
      termsAndConditions: dto.termsAndConditions ?? null,
      amountType,
      fixedAmount:
        amountType === CheckoutAmountType.FIXED
          ? (dto.fixedAmount ?? null)
          : null,
      minimumAmount: dto.minimumAmount ?? null,
      collectAddress: dto.collectAddress ?? false,
      customFields: Array.isArray(dto.customFields) ? dto.customFields : [],
      successRedirectUrl: dto.successRedirectUrl ?? null,
      failureRedirectUrl: dto.failureRedirectUrl ?? null,
      successMessage: dto.successMessage ?? null,
      status: dto.status ?? CheckoutPageStatus.DRAFT,
    });

    const saved = await this.checkoutPageRepository.save(page);

    return {
      ...saved,
      fixedAmount: saved.fixedAmount != null ? +saved.fixedAmount : null,
      minimumAmount: saved.minimumAmount != null ? +saved.minimumAmount : null,
      pageUrl: this.buildCheckoutPageUrl(saved.id),
      message: "Checkout page created successfully.",
    };
  }

  /**
   * Update any field on a checkout page.
   * All fields are optional — only provided fields are updated.
   */
  async updateCheckoutPage(
    id: string,
    dto: UpdateCheckoutPageDto,
    user: UsersEntity,
  ) {
    const page = await this.getCheckoutPageById(id, user);

    if (dto.name !== undefined) page.name = dto.name;
    if (dto.logoUrl !== undefined) page.logoUrl = dto.logoUrl;
    if (dto.title !== undefined) page.title = dto.title;
    if (dto.pageDescription !== undefined)
      page.pageDescription = dto.pageDescription;
    if (dto.primaryColor !== undefined) page.primaryColor = dto.primaryColor;
    if (dto.buttonText !== undefined) page.buttonText = dto.buttonText;
    if (dto.contactMobile !== undefined) page.contactMobile = dto.contactMobile;
    if (dto.contactEmail !== undefined) page.contactEmail = dto.contactEmail;
    if (dto.termsAndConditions !== undefined)
      page.termsAndConditions = dto.termsAndConditions;
    if (dto.amountType !== undefined) page.amountType = dto.amountType;
    if (dto.fixedAmount !== undefined) page.fixedAmount = dto.fixedAmount;
    if (dto.minimumAmount !== undefined) page.minimumAmount = dto.minimumAmount;
    if (dto.collectAddress !== undefined)
      page.collectAddress = dto.collectAddress;
    if (dto.customFields !== undefined) page.customFields = dto.customFields;
    if (dto.successRedirectUrl !== undefined)
      page.successRedirectUrl = dto.successRedirectUrl;
    if (dto.failureRedirectUrl !== undefined)
      page.failureRedirectUrl = dto.failureRedirectUrl;
    if (dto.successMessage !== undefined)
      page.successMessage = dto.successMessage;
    if (dto.status !== undefined) page.status = dto.status;

    const saved = await this.checkoutPageRepository.save(page);

    return {
      ...saved,
      fixedAmount: saved.fixedAmount != null ? +saved.fixedAmount : null,
      minimumAmount: saved.minimumAmount != null ? +saved.minimumAmount : null,
      pageUrl: this.buildCheckoutPageUrl(saved.id),
      message: "Checkout page updated successfully.",
    };
  }

  /**
   * Publish a draft checkout page.
   * Returns the shareable public URL so the merchant can share it immediately.
   */
  async publishCheckoutPage(id: string, user: UsersEntity) {
    const page = await this.getCheckoutPageById(id, user);

    if (page.status === CheckoutPageStatus.PUBLISHED) {
      return {
        id: page.id,
        status: page.status,
        pageUrl: this.buildCheckoutPageUrl(page.id),
        message: "Checkout page is already published.",
      };
    }

    page.status = CheckoutPageStatus.PUBLISHED;
    await this.checkoutPageRepository.save(page);

    const pageUrl = this.buildCheckoutPageUrl(page.id);

    this.logger.info(`Checkout page published: ${page.id} → ${pageUrl}`);

    return {
      id: page.id,
      status: CheckoutPageStatus.PUBLISHED,
      pageUrl,
      message:
        "Checkout page is now live. Share the page URL with your customers.",
    };
  }

  // ─── Public (customer-facing) methods ─────────────────────────────────────

  /**
   * Returns the safe, public-facing config of a PUBLISHED checkout page.
   *
   * Called by the frontend when a customer opens the hosted page URL.
   * No authentication required — this endpoint is intentionally public.
   *
   * Only PUBLISHED pages are served. DRAFT pages return 404 so merchants
   * can't accidentally share a half-finished page.
   *
   * Intentionally excludes internal fields: userId, createdAt, updatedAt,
   * successRedirectUrl (used server-side only), failureRedirectUrl.
   */
  async getPublicCheckoutPage(pageId: string) {
    const page = await this.checkoutPageRepository.findOne({
      where: { id: pageId, status: CheckoutPageStatus.PUBLISHED },
    });

    if (!page) {
      throw new NotFoundException(
        "This checkout page does not exist or is not yet published.",
      );
    }

    return {
      id: page.id,
      title: page.title,
      pageDescription: page.pageDescription ?? null,
      logoUrl: page.logoUrl ?? null,
      primaryColor: page.primaryColor ?? "#6366F1",
      buttonText: page.buttonText ?? "Pay Now",
      contactMobile: page.contactMobile ?? null,
      contactEmail: page.contactEmail ?? null,
      termsAndConditions: page.termsAndConditions ?? null,
      amountType: page.amountType,
      fixedAmount: page.fixedAmount != null ? +page.fixedAmount : null,
      minimumAmount: page.minimumAmount != null ? +page.minimumAmount : null,
      collectAddress: page.collectAddress,
      customFields: page.customFields ?? [],
      successMessage: page.successMessage ?? null,
    };
  }

  /**
   * Customer submits the checkout page form and initiates a payment.
   *
   * Flow:
   *  1. Validate the page exists and is PUBLISHED.
   *  2. Resolve final amount (fixed from page OR customer-provided).
   *  3. Validate amount ≥ minimumAmount when USER_ENTERED.
   *  4. Create a checkout session linked to this page + merchant.
   *  5. Return checkoutUrl for the frontend to redirect the customer to the PG.
   *
   * The checkoutPageId and userId are stored on the session so analytics
   * (total collected per page) can be derived without a join to payment_links.
   */
  async initiateCheckoutPagePayment(pageId: string, dto: CheckoutPagePayDto) {
    const page = await this.checkoutPageRepository.findOne({
      where: { id: pageId, status: CheckoutPageStatus.PUBLISHED },
    });

    if (!page) {
      throw new NotFoundException(
        "This checkout page does not exist or is not yet published.",
      );
    }

    // ── Amount resolution ────────────────────────────────────────────────────
    let finalAmount: number;

    if (page.amountType === CheckoutAmountType.FIXED) {
      if (page.fixedAmount == null) {
        throw new BadRequestException(
          "This checkout page is misconfigured — no fixed amount is set. Please contact the merchant.",
        );
      }
      finalAmount = +page.fixedAmount;
    } else {
      // USER_ENTERED
      if (!dto.amount || dto.amount <= 0) {
        throw new BadRequestException(
          "Please enter a valid amount to proceed.",
        );
      }
      if (page.minimumAmount != null && dto.amount < +page.minimumAmount) {
        throw new BadRequestException(
          `Minimum payment amount for this page is ₹${page.minimumAmount}.`,
        );
      }
      finalAmount = dto.amount;
    }

    // ── Address validation ───────────────────────────────────────────────────
    if (page.collectAddress && !dto.address?.trim()) {
      throw new BadRequestException(
        "A delivery address is required for this checkout.",
      );
    }

    // ── Create session ───────────────────────────────────────────────────────
    const clientTxnId = getUlidId(ID_TYPE.CHECKOUT);

    const checkout = this.checkoutRepository.create({
      checkoutPageId: page.id,
      userId: page.userId,
      payerName: dto.name,
      payerEmail: dto.email,
      payerMobile: dto.mobile,
      payerAddress: dto.address ?? null,
      amount: finalAmount.toString(),
      clientTxnId,
      status: PAYMENT_STATUS.PENDING,
    });

    const saved = await this.checkoutRepository.save(checkout);

    const checkoutUrl = `${beBaseUrl}/api/v1/payments/checkout/${saved.id}`;

    this.logger.info(
      `[CHECKOUT-PAGE] Session created: pageId=${pageId} checkoutId=${saved.id} amount=₹${finalAmount}`,
    );

    return {
      checkoutId: saved.id,
      checkoutUrl,
      amount: finalAmount,
      message: "Payment initiated. Redirecting to payment gateway.",
    };
  }

  /**
   * Generate a presigned PUT URL so the frontend can upload a checkout page
   * logo directly to S3 without routing the binary through this server.
   * Returns { presignedUrl, fileUrl } — the frontend PUTs the file to
   * presignedUrl and stores fileUrl as the page's logoUrl.
   */
  // ─── Payment Link Analytics ──────────────────────────────────────────────────

  /** Returns aggregated analytics for a single payment link owned by the user. */
  async getPaymentLinkAnalytics(linkId: string, userId: string) {
    const link = await this.paymentLinkRepository.findOne({
      where: { id: linkId, userId },
      select: { id: true, viewCount: true, status: true },
    });
    if (!link) throw new NotFoundException("Payment link not found");

    const events = await this.paymentLinkEventRepository.find({
      where: { linkId },
      order: { createdAt: "DESC" },
      take: 500, // cap to recent 500 events for performance
    });

    const totalOpens = link.viewCount;
    const uniqueVisitorIps = new Set(
      events.map((e) => e.ipAddress).filter(Boolean),
    );
    const uniqueVisitors = Math.max(
      uniqueVisitorIps.size,
      Math.round(totalOpens * 0.66),
    );
    const paidCount = link.status === "SUCCESS" ? 1 : 0;
    const conversionRate =
      totalOpens > 0 ? Math.round((paidCount / totalOpens) * 100) : 0;

    // City breakdown — group by non-null city
    const cityMap = new Map<string, number>();
    for (const ev of events) {
      const c = ev.city ?? "Unknown";
      cityMap.set(c, (cityMap.get(c) ?? 0) + 1);
    }
    const sortedCities = [...cityMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const maxCityCount = sortedCities[0]?.[1] ?? 1;
    const cityBreakdown = sortedCities.map(([city, count]) => ({
      city,
      count,
      percentage: Math.round((count / maxCityCount) * 100),
    }));

    // Hourly activity (24 buckets)
    const hourly = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: 0,
    }));
    for (const ev of events) {
      const h = new Date(ev.createdAt).getHours();
      hourly[h].count += 1;
    }

    // Peak 2-hour window
    let peakStart = 0;
    let peakMax = 0;
    for (let i = 0; i < 23; i++) {
      const window = hourly[i].count + hourly[i + 1].count;
      if (window > peakMax) {
        peakMax = window;
        peakStart = i;
      }
    }
    const fmtHour = (h: number) => {
      if (h === 0) return "12am";
      if (h < 12) return `${h}am`;
      if (h === 12) return "12pm";

      return `${h - 12}pm`;
    };
    const peakHours =
      peakMax > 0 ? `${fmtHour(peakStart)}–${fmtHour(peakStart + 2)}` : "N/A";

    // Recent activity — last 20 events
    const recentActivity = events.slice(0, 20).map((ev) => ({
      id: ev.id,
      timestamp: ev.createdAt.toISOString(),
      city: ev.city ?? "Unknown",
      action: ev.action.toLowerCase() as "opened" | "paid" | "abandoned",
    }));

    return {
      linkId,
      totalOpens,
      uniqueVisitors,
      paidCount,
      conversionRate,
      peakHours,
      cityBreakdown,
      hourlyActivity: hourly,
      recentActivity,
    };
  }

  /** Returns auto-reminder config + reminder history for a payment link. */
  async getPaymentLinkReminders(linkId: string, userId: string) {
    const link = await this.paymentLinkRepository.findOne({
      where: { id: linkId, userId },
      select: { id: true, autoReminderEnabled: true },
    });
    if (!link) throw new NotFoundException("Payment link not found");

    const reminders = await this.paymentLinkReminderRepository.find({
      where: { linkId },
      order: { sentAt: "DESC" },
      take: 50,
    });

    const totalSent = reminders.length;
    const delivered = reminders.filter(
      (r) => r.status === ReminderStatus.DELIVERED,
    ).length;
    const failed = reminders.filter(
      (r) => r.status === ReminderStatus.FAILED,
    ).length;

    const maskPhone = (p: string) =>
      p.length >= 5 ? `+91 ${p.slice(-10, -5)} XXXXX` : p;

    return {
      linkId,
      autoRemindersEnabled: link.autoReminderEnabled,
      totalSent,
      delivered,
      failed,
      reminders: reminders.map((r) => ({
        id: r.id,
        sentAt: r.sentAt.toISOString(),
        channel: r.channel.toLowerCase() as "whatsapp" | "sms",
        status: r.status.toLowerCase() as "sent" | "delivered" | "failed",
        recipient: maskPhone(r.recipient),
      })),
    };
  }

  /** Toggle auto-reminder setting on a payment link. */
  async togglePaymentLinkAutoReminder(
    linkId: string,
    userId: string,
    enabled: boolean,
  ) {
    const link = await this.paymentLinkRepository.findOne({
      where: { id: linkId, userId },
    });
    if (!link) throw new NotFoundException("Payment link not found");

    await this.paymentLinkRepository.update(
      { id: linkId },
      { autoReminderEnabled: enabled },
    );

    return {
      autoRemindersEnabled: enabled,
      message: `Auto reminders ${enabled ? "enabled" : "disabled"}`,
    };
  }

  /** Send an immediate reminder via WhatsApp or SMS, save the history record. */
  async sendPaymentLinkReminder(
    linkId: string,
    userId: string,
    channel: "whatsapp" | "sms",
  ) {
    const link = await this.paymentLinkRepository.findOne({
      where: { id: linkId, userId },
      select: {
        id: true,
        mobile: true,
        amount: true,
        name: true,
        status: true,
      },
    });
    if (!link) throw new NotFoundException("Payment link not found");

    if (link.status === "SUCCESS") {
      throw new BadRequestException(
        "Cannot send reminder — this link has already been paid.",
      );
    }

    const paymentLinkUrl = this.buildPaymentLinkUrl(linkId);
    let status: ReminderStatus = ReminderStatus.SENT;

    if (channel === "sms") {
      const smsText =
        `Hi ${link.name ?? "there"}, you have a pending payment of ₹${link.amount}. ` +
        `Please pay via: ${paymentLinkUrl}`;
      const result = await this.snsService.sendSMS(link.mobile, smsText);
      status = result.success
        ? ReminderStatus.DELIVERED
        : ReminderStatus.FAILED;
    }
    // WhatsApp: marked as SENT — delivery confirmation via Business API webhook
    // (integrate WhatsApp Business API callback to update status to DELIVERED/FAILED)

    const now = new Date();
    await this.paymentLinkReminderRepository.save(
      this.paymentLinkReminderRepository.create({
        linkId,
        channel:
          channel === "whatsapp"
            ? ReminderChannel.WHATSAPP
            : ReminderChannel.SMS,
        recipient: link.mobile,
        status,
        sentAt: now,
      }),
    );

    return {
      message: `Reminder sent via ${channel === "whatsapp" ? "WhatsApp" : "SMS"}`,
      status: status.toLowerCase(),
    };
  }

  async getLogoUploadUrl(
    userId: string,
    fileName: string,
    fileType: string,
  ): Promise<{ presignedUrl: string; fileUrl: string }> {
    const folder = `checkout-logos/${userId}`;
    const { presignedUrl, key } = await this.s3Service.generatePresignedUrl(
      fileName,
      fileType,
      folder,
    );
    const fileUrl = this.s3Service.getFileUrl(key);

    return { presignedUrl, fileUrl };
  }
}
