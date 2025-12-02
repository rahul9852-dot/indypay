import {
  Injectable,
  InternalServerErrorException,
  Inject,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Response } from "express";
import {
  Between,
  FindOptionsSelect,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from "typeorm";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { DownloadCsvDto } from "./download-csv.dto";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { PAYMENT_STATUS, PAYMENT_TYPE } from "@/enums/payment.enum";
import { getCsv } from "@/utils/csv.utils";
import { UsersEntity } from "@/entities/user.entity";
import { DateDto, PaginationDto } from "@/dtos/common.dto";
import { SettlementsEntity } from "@/entities/settlements.entity";
import { getPagination } from "@/utils/pagination.utils";
import { todayEndDate, todayStartDate } from "@/utils/date.utils";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import { CacheMonitorService } from "@/shared/cache-monitor/cache-monitor.service";
import { CacheTTLCalculator } from "@/utils/cache-ttl.utils";
import { REDIS_KEYS } from "@/constants/redis-cache.constant";

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(TransactionsEntity)
    private readonly transactionsRepository: Repository<TransactionsEntity>,

    @InjectRepository(PayInOrdersEntity)
    private readonly payInOrdersRepository: Repository<PayInOrdersEntity>,
    @InjectRepository(PayOutOrdersEntity)
    private readonly payOutOrdersRepository: Repository<PayOutOrdersEntity>,

    @InjectRepository(SettlementsEntity)
    private readonly settlementsRepository: Repository<SettlementsEntity>,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,

    private readonly cacheMonitor: CacheMonitorService,
  ) {}

  selectQuery: FindOptionsSelect<TransactionsEntity> = {
    id: true,
    transactionType: true,
    user: {
      id: true,
    },
    payInOrder: {
      id: true,
      orderId: true,
      amount: true,
      status: true,
      createdAt: true,
      commissionAmount: true,
      gstAmount: true,
      netPayableAmount: true,
    },
    payOutOrder: {
      id: true,
      orderId: true,
      amount: true,
      status: true,
      amountBeforeDeduction: true,
      commissionInPercentage: true,
      gstInPercentage: true,
      payoutId: true,
      createdAt: true,
    },
  };

  async downloadCsvAllPayinTransactionsMerchant(
    user: UsersEntity,
    downloadCsvDto: DownloadCsvDto,
    res: Response,
  ) {
    const { transactionType, startDate, endDate } = downloadCsvDto;
    const where: FindOptionsWhere<PayInOrdersEntity> = {
      user: { id: user.id },
    };

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(new Date(endDate));
    }

    if (transactionType === PAYMENT_TYPE.PAYIN) {
      const transactions = await this.payInOrdersRepository.find({
        where,
        select: {
          id: true,
          amount: true,
          commissionAmount: true,
          gstAmount: true,
          netPayableAmount: true,
          status: true,
          createdAt: true,
          orderId: true,
          txnRefId: true,
        },
      });

      const fields = [
        { label: "ID", value: "id" },
        { label: "Amount", value: "amount" },
        { label: "Commission", value: "commissionAmount" },
        { label: "GST", value: "gstAmount" },
        { label: "Net Payable", value: "netPayableAmount" },
        { label: "Status", value: "status" },
        { label: "Order ID", value: "orderId" },
        { label: "Txn Ref ID", value: "txnRefId" },
        { label: "Created At", value: "createdAt" },
      ];

      const csv = getCsv(transactions, fields);
      const date = new Date().toLocaleString("en-IN").replace(/[/:, ]/gi, "_");

      const name = `payin_transactions_${date}.csv`;

      if (csv) {
        // Set headers to indicate a file download
        res.header("Content-Type", "text/csv");
        res.attachment(name);

        // Send the CSV data
        return res.send(csv);
      }
    } else {
      return null;
    }

    throw new InternalServerErrorException("Something went wrong");
  }
  async downloadCsvAllPayinTransactionsAdmin(
    downloadCsvDto: DownloadCsvDto,
    res: Response,
  ) {
    const { transactionType, startDate, endDate } = downloadCsvDto;
    const where: FindOptionsWhere<PayInOrdersEntity> = {};

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(new Date(endDate));
    }

    if (transactionType === PAYMENT_TYPE.PAYIN) {
      const transactions = await this.payInOrdersRepository.find({
        where,
        select: {
          id: true,
          amount: true,
          commissionAmount: true,
          gstAmount: true,
          netPayableAmount: true,
          status: true,
          createdAt: true,
          orderId: true,
          txnRefId: true,
        },
      });

      const fields = [
        { label: "ID", value: "id" },
        { label: "Amount", value: "amount" },
        { label: "Commission", value: "commissionAmount" },
        { label: "GST", value: "gstAmount" },
        { label: "Net Payable", value: "netPayableAmount" },
        { label: "Status", value: "status" },
        { label: "Order ID", value: "orderId" },
        { label: "Txn Ref ID", value: "txnRefId" },
        { label: "Created At", value: "createdAt" },
      ];

      const csv = getCsv(transactions, fields);
      const date = new Date().toLocaleString("en-IN").replace(/[/:, ]/gi, "_");

      const name = `payin_transactions_${date}.csv`;

      if (csv) {
        // Set headers to indicate a file download
        res.header("Content-Type", "text/csv");
        res.attachment(name);

        // Send the CSV data
        return res.send(csv);
      }
    } else {
      return null;
    }

    throw new InternalServerErrorException("Something went wrong");
  }

  async getAllTransactionsAdmin({
    page = 1,
    limit = 10,
    search = "",
    sort = "id",
    order = "DESC",
  }: PaginationDto) {
    const [transactions, totalItems] =
      await this.transactionsRepository.findAndCount({
        where: [
          {
            user: {
              email: ILike(`%${search}%`),
            },
          },
          {
            payInOrder: {
              orderId: ILike(`%${search}%`),
            },
          },
          {
            payOutOrder: {
              orderId: ILike(`%${search}%`),
            },
          },
        ],
        relations: {
          user: true,
          payInOrder: true,
          payOutOrder: true,
        },
        select: this.selectQuery,
        skip: (page - 1) * limit,
        take: limit,
        order: {
          [sort]: order,
        },
      });

    const pagination = getPagination({
      totalItems,
      page,
      limit,
    });

    return {
      data: transactions,
      pagination,
    };
  }

  async getTransactionByIdAdmin(transactionId: string) {
    return await this.transactionsRepository.findOne({
      where: { id: transactionId },
      relations: {
        user: true,
        payInOrder: true,
        payOutOrder: true,
      },
      select: {
        ...this.selectQuery,
        user: {
          fullName: true,
          email: true,
          mobile: true,
          createdAt: true,
        },
      },
    });
  }

  async getAllTransactionMerchant(
    userId: string,
    {
      limit = 10,
      page = 1,
      sort = "id",
      order = "DESC",
      search = "",
    }: PaginationDto,
  ) {
    return await this.transactionsRepository.find({
      where: [
        {
          user: { id: userId },
          payInOrder: { orderId: ILike(`%${search}%`) },
        },
        {
          user: { id: userId },
          payOutOrder: { orderId: ILike(`%${search}%`) },
        },
      ],
      relations: {
        user: true,
        payInOrder: true,
        payOutOrder: true,
      },
      select: this.selectQuery,
      skip: (page - 1) * limit,
      take: limit,
      order: {
        [sort]: order,
      },
    });
  }

  async getTransactionMerchant(userId: string, transactionId: string) {
    return await this.transactionsRepository.findOne({
      where: { id: transactionId, user: { id: userId } },
      relations: {
        user: true,
        payInOrder: true,
        payOutOrder: true,
      },
      select: {
        ...this.selectQuery,
        user: {
          fullName: true,
          email: true,
          mobile: true,
          createdAt: true,
        },
      },
    });
  }

  async getAllTransactionsOfMerchant(
    userId: string,
    {
      limit = 10,
      page = 1,
      search = "",
      sort = "id",
      order = "DESC",
    }: PaginationDto,
  ) {
    return await this.transactionsRepository.find({
      where: [
        {
          user: {
            id: userId,
            payInOrders: {
              orderId: ILike(`%${search}%`),
            },
          },
        },
        {
          user: {
            id: userId,
            payOutOrders: {
              orderId: ILike(`%${search}%`),
            },
          },
        },
      ],
      relations: {
        user: true,
        payInOrder: true,
        payOutOrder: true,
      },
      select: this.selectQuery,
      skip: (page - 1) * limit,
      take: limit,
      order: {
        [sort]: order,
      },
    });
  }

  async getStatsForAdmin({
    startDate = todayStartDate(),
    endDate = todayEndDate(),
  }: DateDto) {
    // Generate cache key with normalized date strings
    const startDateStr = new Date(startDate).toISOString().split("T")[0];
    const endDateStr = new Date(endDate).toISOString().split("T")[0];
    const cacheKey = REDIS_KEYS.STATS_ADMIN(startDateStr, endDateStr);

    // Try to get from cache
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      this.cacheMonitor.recordHit(cacheKey);
      this.logger.debug(
        `📦 Cache HIT for admin stats: (${startDateStr} to ${endDateStr})`,
      );

      return cachedData;
    }

    // Cache miss - fetch from database
    this.cacheMonitor.recordMiss(cacheKey);
    this.logger.debug(
      `💾 Cache MISS for admin stats: (${startDateStr} to ${endDateStr}) - Fetching from DB...`,
    );

    // Fetch all data in parallel
    const [
      payinSuccessAmount,
      payinSuccessCount,
      settlementSuccessAmount,
      settlementSuccessCount,
      payoutSuccessAmount,
      payoutSuccessCount,
      recentTransactions,
      topMerchantsRaw,
    ] = await Promise.all([
      // PayIn success stats
      this.payInOrdersRepository
        .createQueryBuilder("payin")
        .select("SUM(payin.amount)", "sum")
        .where("payin.status = :status", { status: PAYMENT_STATUS.SUCCESS })
        .andWhere("payin.createdAt BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .getRawOne()
        .then((result) => parseFloat(result?.sum) || 0),
      this.payInOrdersRepository
        .createQueryBuilder("payin")
        .where("payin.status = :status", { status: PAYMENT_STATUS.SUCCESS })
        .andWhere("payin.createdAt BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .getCount(),

      // Settlement success stats
      this.settlementsRepository
        .createQueryBuilder("settlement")
        .select("SUM(settlement.amountAfterDeduction)", "sum")
        .where("settlement.status = :status", {
          status: PAYMENT_STATUS.SUCCESS,
        })
        .andWhere("settlement.createdAt BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .getRawOne()
        .then((result) => parseFloat(result?.sum) || 0),
      this.settlementsRepository
        .createQueryBuilder("settlement")
        .where("settlement.status = :status", {
          status: PAYMENT_STATUS.SUCCESS,
        })
        .andWhere("settlement.createdAt BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .getCount(),

      // Payout success stats
      this.payOutOrdersRepository
        .createQueryBuilder("payout")
        .select("SUM(payout.amount)", "sum")
        .where("payout.status = :status", { status: PAYMENT_STATUS.SUCCESS })
        .andWhere("payout.createdAt BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .getRawOne()
        .then((result) => parseFloat(result?.sum) || 0),
      this.payOutOrdersRepository
        .createQueryBuilder("payout")
        .where("payout.status = :status", { status: PAYMENT_STATUS.SUCCESS })
        .andWhere("payout.createdAt BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .getCount(),

      // Recent 5 transactions (PayIn only)
      this.payInOrdersRepository
        .createQueryBuilder("payin")
        .select([
          "payin.orderId",
          "payin.amount",
          "payin.paymentMethod",
          "payin.status",
          "payin.createdAt",
          "user.id",
          "user.fullName",
          "user.email",
        ])
        .innerJoin("payin.user", "user")
        .where("payin.status = :status", { status: PAYMENT_STATUS.SUCCESS })
        .andWhere("payin.createdAt BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .orderBy("payin.createdAt", "DESC")
        .limit(5)
        .getMany(),

      // Top 5 merchants by transaction amount
      this.payInOrdersRepository
        .createQueryBuilder("payin")
        .select("payin.userId", "userId")
        .addSelect("user.fullName", "merchantName")
        .addSelect("user.email", "merchantEmail")
        .addSelect("SUM(payin.amount)", "totalAmount")
        .addSelect("COUNT(payin.id)", "transactionCount")
        .innerJoin("payin.user", "user")
        .where("payin.status = :status", { status: PAYMENT_STATUS.SUCCESS })
        .andWhere("payin.createdAt BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .groupBy("payin.userId")
        .addGroupBy("user.fullName")
        .addGroupBy("user.email")
        .orderBy("SUM(payin.amount)", "DESC")
        .limit(5)
        .getRawMany(),
    ]);

    const result = {
      payin: {
        successAmount: payinSuccessAmount || 0,
        successCount: payinSuccessCount || 0,
      },
      payout: {
        successAmount: payoutSuccessAmount || 0,
        successCount: payoutSuccessCount || 0,
      },
      settlement: {
        successAmount: settlementSuccessAmount || 0,
        successCount: settlementSuccessCount || 0,
      },
      recentTransactions: recentTransactions.map((txn) => ({
        date: txn.createdAt,
        transactionId: txn.orderId,
        method: txn.paymentMethod,
        amount: txn.amount,
        status: txn.status,
      })),
      topMerchants: topMerchantsRaw.map((merchant) => ({
        merchantName: merchant.merchantName,
        merchantEmail: merchant.merchantEmail,
        totalAmount: parseFloat(merchant.totalAmount) || 0,
        transactionCount: parseInt(merchant.transactionCount) || 0,
      })),
    };

    // Calculate smart TTL based on date range
    const ttl = CacheTTLCalculator.calculateTTL(
      new Date(startDate),
      new Date(endDate),
    );

    // Store in cache with smart TTL
    await this.cacheManager.set(cacheKey, result, ttl);
    this.cacheMonitor.recordSet(cacheKey, ttl);
    this.logger.debug(
      `✅ Cached admin stats with TTL: ${CacheTTLCalculator.getTTLDescription(ttl)}`,
    );

    return result;
  }

  async getStatsForMerchant(
    userId: string,
    { startDate = todayStartDate(), endDate = todayEndDate() }: DateDto,
  ) {
    // Generate cache key with normalized date strings
    const startDateStr = new Date(startDate).toISOString().split("T")[0];
    const endDateStr = new Date(endDate).toISOString().split("T")[0];
    const cacheKey = REDIS_KEYS.STATS_MERCHANT(
      userId,
      startDateStr,
      endDateStr,
    );

    // Try to get from cache
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      this.cacheMonitor.recordHit(cacheKey);
      this.logger.debug(
        `📦 Cache HIT for merchant stats: ${userId} (${startDateStr} to ${endDateStr})`,
      );

      return cachedData;
    }

    // Cache miss - fetch from database
    this.cacheMonitor.recordMiss(cacheKey);
    this.logger.debug(
      `💾 Cache MISS for merchant stats: ${userId} (${startDateStr} to ${endDateStr}) - Fetching from DB...`,
    );

    // Fetch all data in parallel
    const [
      payinSuccessAmount,
      payinSuccessCount,
      settlementSuccessAmount,
      settlementSuccessCount,
      payoutSuccessAmount,
      payoutSuccessCount,
      recentTransactions,
    ] = await Promise.all([
      // PayIn success stats
      this.payInOrdersRepository
        .createQueryBuilder("payin")
        .select("SUM(payin.amount)", "sum")
        .where("payin.userId = :userId", { userId })
        .andWhere("payin.status = :status", { status: PAYMENT_STATUS.SUCCESS })
        .andWhere("payin.createdAt BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .getRawOne()
        .then((result) => parseFloat(result?.sum) || 0),
      this.payInOrdersRepository
        .createQueryBuilder("payin")
        .where("payin.userId = :userId", { userId })
        .andWhere("payin.status = :status", { status: PAYMENT_STATUS.SUCCESS })
        .andWhere("payin.createdAt BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .getCount(),

      // Settlement success stats
      this.settlementsRepository
        .createQueryBuilder("settlement")
        .select("SUM(settlement.amountAfterDeduction)", "sum")
        .where("settlement.userId = :userId", { userId })
        .andWhere("settlement.status = :status", {
          status: PAYMENT_STATUS.SUCCESS,
        })
        .andWhere("settlement.createdAt BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .getRawOne()
        .then((result) => parseFloat(result?.sum) || 0),
      this.settlementsRepository
        .createQueryBuilder("settlement")
        .where("settlement.userId = :userId", { userId })
        .andWhere("settlement.status = :status", {
          status: PAYMENT_STATUS.SUCCESS,
        })
        .andWhere("settlement.createdAt BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .getCount(),

      // Payout success stats
      this.payOutOrdersRepository
        .createQueryBuilder("payout")
        .select("SUM(payout.amount)", "sum")
        .where("payout.userId = :userId", { userId })
        .andWhere("payout.status = :status", { status: PAYMENT_STATUS.SUCCESS })
        .andWhere("payout.createdAt BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .getRawOne()
        .then((result) => parseFloat(result?.sum) || 0),
      this.payOutOrdersRepository
        .createQueryBuilder("payout")
        .where("payout.userId = :userId", { userId })
        .andWhere("payout.status = :status", { status: PAYMENT_STATUS.SUCCESS })
        .andWhere("payout.createdAt BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .getCount(),

      // Recent 5 transactions (PayIn only)
      this.payInOrdersRepository
        .createQueryBuilder("payin")
        .select([
          "payin.orderId",
          "payin.amount",
          "payin.paymentMethod",
          "payin.status",
          "payin.createdAt",
        ])
        .where("payin.userId = :userId", { userId })
        .andWhere("payin.status = :status", { status: PAYMENT_STATUS.SUCCESS })
        .andWhere("payin.createdAt BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .orderBy("payin.createdAt", "DESC")
        .limit(5)
        .getMany(),
    ]);

    const result = {
      payin: {
        successAmount: payinSuccessAmount || 0,
        successCount: payinSuccessCount || 0,
      },
      payout: {
        successAmount: payoutSuccessAmount || 0,
        successCount: payoutSuccessCount || 0,
      },
      settlement: {
        successAmount: settlementSuccessAmount || 0,
        successCount: settlementSuccessCount || 0,
      },
      recentTransactions: recentTransactions.map((txn) => ({
        date: txn.createdAt,
        transactionId: txn.orderId,
        method: txn.paymentMethod,
        amount: txn.amount,
        status: txn.status,
      })),
    };

    // Calculate smart TTL based on date range
    const ttl = CacheTTLCalculator.calculateTTL(
      new Date(startDate),
      new Date(endDate),
    );

    // Store in cache with smart TTL
    await this.cacheManager.set(cacheKey, result, ttl);
    this.cacheMonitor.recordSet(cacheKey, ttl);
    this.logger.debug(
      `✅ Cached merchant stats with TTL: ${CacheTTLCalculator.getTTLDescription(ttl)}`,
    );

    return result;
  }
}
