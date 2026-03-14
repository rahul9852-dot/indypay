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
} from "./dto/checkout-page.dto";
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

    private readonly dataSource: DataSource,
    private readonly encryptionAlgoService: CryptoService,
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

    const [data, totalItems] = await this.paymentLinkRepository.findAndCount({
      where: query,
      relations: {
        user: true,
      },
      select: {
        id: true,
        amount: true,
        email: true,
        name: true,
        mobile: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        notifyOnEmail: true,
        notifyOnNumber: true,
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

  /**
   * Create a payment link with encrypted details and expiry time
   */
  async createPaymentLink(
    createPaymentLinkDto: CreatePaymentLinkDto,
    user: UsersEntity,
  ) {
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
      expiresInMinutes,
      notifyOnEmail = false,
      notifyOnNumber = false,
    } = createPaymentLinkDto;

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    // Prepare payment details to encrypt (amount, email, number, notify flags)
    const paymentDetails = {
      amount,
      name,
      email,
      mobile,
      expiresAt: expiresAt.toISOString(),
      notifyOnEmail,
      notifyOnNumber,
    };

    // Encrypt the payment details
    const encryptedData = this.encryptionAlgoService.encrypt(
      JSON.stringify(paymentDetails),
    );

    const paymentLink = this.paymentLinkRepository.create({
      amount,
      email,
      mobile,
      name,
      userId: user.id,
      encryptedData,
      expiresAt,
      notifyOnEmail,
      notifyOnNumber,
      status: PAYMENT_STATUS.PENDING,
    });

    const savedLink = await this.paymentLinkRepository.save(paymentLink);

    const paymentLinkUrl = `${beBaseUrl}/api/v1/payments/payment-link/${savedLink.id}`;

    this.logger.info(
      `Payment link created: ${LoggerPlaceHolder.Json}`,
      savedLink.id,
    );

    return {
      linkId: savedLink.id,
      paymentLinkUrl,
      expiresAt: expiresAt.toISOString(),
      message: "Payment link created successfully",
    };
  }

  /**
   * Get payment link details by linkId (decrypts and returns details)
   */
  async getPaymentLinkDetails(linkId: string) {
    const paymentLink = await this.paymentLinkRepository.findOne({
      where: { id: linkId },
    });

    if (!paymentLink) {
      throw new NotFoundException("Payment link not found");
    }

    // Check if link has expired
    const now = new Date();
    if (now > paymentLink.expiresAt) {
      throw new BadRequestException("Payment link has expired");
    }

    // Decrypt the payment details
    let paymentDetails: any;
    try {
      const decryptedData = this.encryptionAlgoService.decrypt(
        paymentLink.encryptedData,
      );
      paymentDetails = JSON.parse(decryptedData);
    } catch (error) {
      this.logger.error(
        `Failed to decrypt payment link data: ${LoggerPlaceHolder.Json}`,
        error,
      );
      throw new BadRequestException("Failed to decrypt payment link data");
    }

    // Check if the decrypted expiry time has passed
    const decryptedExpiresAt = new Date(paymentDetails.expiresAt);
    if (now > decryptedExpiresAt) {
      throw new BadRequestException("Payment link has expired");
    }

    return {
      linkId: paymentLink.id,
      amount: paymentDetails.amount,
      email: paymentDetails.email,
      name: paymentDetails.name ?? paymentLink.name ?? null,
      mobile: paymentDetails.mobile,
      expiresAt: paymentDetails.expiresAt,
      isExpired: false,
      notifyOnEmail: !!paymentDetails.notifyOnEmail,
      notifyOnNumber: !!paymentDetails.notifyOnNumber,
    };
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

  /**
   * List all custom checkout pages for the current user
   */
  async getAllCheckoutPages(userId: string): Promise<CheckoutPageEntity[]> {
    return this.checkoutPageRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Get a single custom checkout page by id (must belong to user)
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
   * Create a custom checkout page
   */
  async createCheckoutPage(
    dto: CreateCheckoutPageDto,
    user: UsersEntity,
  ): Promise<CheckoutPageEntity> {
    const amountType = dto.amountType ?? CheckoutAmountType.USER_ENTERED;
    const page = this.checkoutPageRepository.create({
      userId: user.id,
      name: dto.name,
      logoUrl: dto.logoUrl,
      title: dto.title,
      pageDescription: dto.pageDescription,
      contactMobile: dto.contactMobile,
      contactEmail: dto.contactEmail,
      termsAndConditions: dto.termsAndConditions,
      amountType,
      fixedAmount:
        amountType === CheckoutAmountType.FIXED
          ? (dto.fixedAmount ?? null)
          : null,
      customFields: Array.isArray(dto.customFields) ? dto.customFields : [],
      status: dto.status ?? CheckoutPageStatus.DRAFT,
    });

    return this.checkoutPageRepository.save(page);
  }

  /**
   * Update a custom checkout page
   */
  async updateCheckoutPage(
    id: string,
    dto: UpdateCheckoutPageDto,
    user: UsersEntity,
  ): Promise<CheckoutPageEntity> {
    const page = await this.getCheckoutPageById(id, user);
    if (dto.amountType !== undefined) page.amountType = dto.amountType;
    if (dto.fixedAmount !== undefined) page.fixedAmount = dto.fixedAmount;
    if (dto.name !== undefined) page.name = dto.name;
    if (dto.logoUrl !== undefined) page.logoUrl = dto.logoUrl;
    if (dto.title !== undefined) page.title = dto.title;
    if (dto.pageDescription !== undefined)
      page.pageDescription = dto.pageDescription;
    if (dto.contactMobile !== undefined) page.contactMobile = dto.contactMobile;
    if (dto.contactEmail !== undefined) page.contactEmail = dto.contactEmail;
    if (dto.termsAndConditions !== undefined)
      page.termsAndConditions = dto.termsAndConditions;
    if (dto.customFields !== undefined) page.customFields = dto.customFields;
    if (dto.status !== undefined) page.status = dto.status;

    return this.checkoutPageRepository.save(page);
  }

  /**
   * Publish a draft checkout page (set status to PUBLISHED)
   */
  async publishCheckoutPage(
    id: string,
    user: UsersEntity,
  ): Promise<CheckoutPageEntity> {
    const page = await this.getCheckoutPageById(id, user);
    page.status = CheckoutPageStatus.PUBLISHED;

    return this.checkoutPageRepository.save(page);
  }
}
