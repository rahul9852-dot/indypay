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
import * as dayjs from "dayjs";
import { DownloadCsvDto } from "./download-csv.dto";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { PAYMENT_STATUS, PAYMENT_TYPE } from "@/enums/payment.enum";
import { getCsv } from "@/utils/csv.utils";
import { UsersEntity } from "@/entities/user.entity";
import { DateDto, PaginationDto } from "@/dtos/common.dto";
import { SettlementsEntity } from "@/entities/settlements.entity";
import { getPagination } from "@/utils/pagination.utils";
import {
  todayEndDate,
  todayStartDate,
  getCurrentWeekDates,
  getLastWeekDates,
} from "@/utils/date.utils";
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

  /**
   * Fetch daily stats for a specific date (with caching)
   * Daily stats are cached and updated throughout the day
   */
  private async fetchDailyStats(date: Date): Promise<{
    payin: { successAmount: number; successCount: number };
    payout: { successAmount: number; successCount: number };
    settlement: { successAmount: number; successCount: number };
  }> {
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    const cacheKey = REDIS_KEYS.STATS_ADMIN_DAILY(dateStr);

    // Try to get from cache
    const cachedData = await this.cacheManager.get<{
      payin: { successAmount: number; successCount: number };
      payout: { successAmount: number; successCount: number };
      settlement: { successAmount: number; successCount: number };
    }>(cacheKey);

    if (cachedData) {
      this.cacheMonitor.recordHit(cacheKey);
      this.logger.debug(`📦 Cache HIT for daily stats: ${dateStr}`);

      return cachedData;
    }

    // Cache miss - fetch from database
    this.cacheMonitor.recordMiss(cacheKey);
    this.logger.debug(
      `💾 Cache MISS for daily stats: ${dateStr} - Fetching from DB...`,
    );

    const dayStart = dayjs(date).startOf("day").toDate();
    const dayEnd = dayjs(date).endOf("day").toDate();

    const [
      payinSuccessAmount,
      payinSuccessCount,
      settlementSuccessAmount,
      settlementSuccessCount,
      payoutSuccessAmount,
      payoutSuccessCount,
    ] = await Promise.all([
      // PayIn success stats
      this.payInOrdersRepository
        .createQueryBuilder("payin")
        .select("SUM(payin.amount)", "sum")
        .where("payin.status = :status", { status: PAYMENT_STATUS.SUCCESS })
        .andWhere("payin.createdAt BETWEEN :startDate AND :endDate", {
          startDate: dayStart,
          endDate: dayEnd,
        })
        .getRawOne()
        .then((result) => parseFloat(result?.sum) || 0),
      this.payInOrdersRepository
        .createQueryBuilder("payin")
        .where("payin.status = :status", { status: PAYMENT_STATUS.SUCCESS })
        .andWhere("payin.createdAt BETWEEN :startDate AND :endDate", {
          startDate: dayStart,
          endDate: dayEnd,
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
          startDate: dayStart,
          endDate: dayEnd,
        })
        .getRawOne()
        .then((result) => parseFloat(result?.sum) || 0),
      this.settlementsRepository
        .createQueryBuilder("settlement")
        .where("settlement.status = :status", {
          status: PAYMENT_STATUS.SUCCESS,
        })
        .andWhere("settlement.createdAt BETWEEN :startDate AND :endDate", {
          startDate: dayStart,
          endDate: dayEnd,
        })
        .getCount(),

      // Payout success stats
      this.payOutOrdersRepository
        .createQueryBuilder("payout")
        .select("SUM(payout.amount)", "sum")
        .where("payout.status = :status", { status: PAYMENT_STATUS.SUCCESS })
        .andWhere("payout.createdAt BETWEEN :startDate AND :endDate", {
          startDate: dayStart,
          endDate: dayEnd,
        })
        .getRawOne()
        .then((result) => parseFloat(result?.sum) || 0),
      this.payOutOrdersRepository
        .createQueryBuilder("payout")
        .where("payout.status = :status", { status: PAYMENT_STATUS.SUCCESS })
        .andWhere("payout.createdAt BETWEEN :startDate AND :endDate", {
          startDate: dayStart,
          endDate: dayEnd,
        })
        .getCount(),
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
    };

    // Cache daily stats - for current day, use 5 minutes TTL (frequently updated)
    // For past days, use 24 hours TTL (won't change)
    const isToday = dayjs(date).isSame(dayjs(), "day");
    const ttl = isToday ? 5 * 60 * 1000 : 24 * 60 * 60 * 1000; // 5 min for today, 24h for past days

    await this.cacheManager.set(cacheKey, result, ttl);
    this.cacheMonitor.recordSet(cacheKey, ttl);
    this.logger.debug(
      `✅ Cached daily stats for ${dateStr} with TTL: ${isToday ? "5 minutes" : "24 hours"}`,
    );

    return result;
  }

  /**
   * Aggregate stats from multiple daily cached stats
   * This is much faster than querying the entire date range
   */
  private async aggregateStatsFromDailyCache(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    payin: { successAmount: number; successCount: number };
    payout: { successAmount: number; successCount: number };
    settlement: { successAmount: number; successCount: number };
  }> {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const days: Date[] = [];

    // Generate all dates in the range
    let current = start;
    while (current.isBefore(end) || current.isSame(end, "day")) {
      days.push(current.toDate());
      current = current.add(1, "day");
    }

    // Fetch all daily stats in parallel (will use cache if available)
    const dailyStats = await Promise.all(
      days.map((day) => this.fetchDailyStats(day)),
    );

    // Aggregate the results
    const aggregated = dailyStats.reduce(
      (acc, day) => ({
        payin: {
          successAmount: acc.payin.successAmount + day.payin.successAmount,
          successCount: acc.payin.successCount + day.payin.successCount,
        },
        payout: {
          successAmount: acc.payout.successAmount + day.payout.successAmount,
          successCount: acc.payout.successCount + day.payout.successCount,
        },
        settlement: {
          successAmount:
            acc.settlement.successAmount + day.settlement.successAmount,
          successCount:
            acc.settlement.successCount + day.settlement.successCount,
        },
      }),
      {
        payin: { successAmount: 0, successCount: 0 },
        payout: { successAmount: 0, successCount: 0 },
        settlement: { successAmount: 0, successCount: 0 },
      },
    );

    return aggregated;
  }

  /**
   * Helper method to fetch stats for a specific date range (with caching)
   * Used internally for week-over-week comparisons
   * Now uses daily cache aggregation for better performance
   */
  private async fetchStatsForDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    payin: { successAmount: number; successCount: number };
    payout: { successAmount: number; successCount: number };
    settlement: { successAmount: number; successCount: number };
  }> {
    // Use daily cache aggregation for better performance
    // This will fetch daily stats from cache (or DB if not cached) and aggregate them
    return this.aggregateStatsFromDailyCache(startDate, endDate);
  }

  /**
   * Calculate percentage change between two values
   */
  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return ((current - previous) / previous) * 100;
  }

  /**
   * Get admin stats with week-over-week comparison
   * Returns current week stats compared to last week with percentage changes
   */
  async getStatsForAdminWithComparison() {
    const currentWeek = getCurrentWeekDates();
    const lastWeek = getLastWeekDates();

    // Fetch both weeks' stats in parallel (will use cache if available)
    const [currentWeekStats, lastWeekStats, fullStats] = await Promise.all([
      this.fetchStatsForDateRange(currentWeek.startDate, currentWeek.endDate),
      this.fetchStatsForDateRange(lastWeek.startDate, lastWeek.endDate),
      // Also get full stats with recent transactions and top merchants for current week
      this.getStatsForAdmin({
        startDate: currentWeek.startDate,
        endDate: currentWeek.endDate,
      }) as Promise<{
        payin: { successAmount: number; successCount: number };
        payout: { successAmount: number; successCount: number };
        settlement: { successAmount: number; successCount: number };
        recentTransactions: any[];
        topMerchants: any[];
      }>,
    ]);

    // Calculate percentage changes
    const payinPercentageChange = this.calculatePercentageChange(
      currentWeekStats.payin.successAmount,
      lastWeekStats.payin.successAmount,
    );

    const payoutPercentageChange = this.calculatePercentageChange(
      currentWeekStats.payout.successAmount,
      lastWeekStats.payout.successAmount,
    );

    const settlementPercentageChange = this.calculatePercentageChange(
      currentWeekStats.settlement.successAmount,
      lastWeekStats.settlement.successAmount,
    );

    return {
      currentWeek: {
        payin: {
          ...currentWeekStats.payin,
          percentageChange: payinPercentageChange,
        },
        payout: {
          ...currentWeekStats.payout,
          percentageChange: payoutPercentageChange,
        },
        settlement: {
          ...currentWeekStats.settlement,
          percentageChange: settlementPercentageChange,
        },
      },
      lastWeek: {
        payin: lastWeekStats.payin,
        payout: lastWeekStats.payout,
        settlement: lastWeekStats.settlement,
      },
      recentTransactions: fullStats.recentTransactions,
      topMerchants: fullStats.topMerchants,
    };
  }

  async getStatsForAdmin({
    startDate = todayStartDate(),
    endDate = todayEndDate(),
  }: DateDto) {
    const startDateStr = dayjs(startDate).format("YYYY-MM-DD");
    const endDateStr = dayjs(endDate).format("YYYY-MM-DD");
    const isSingleDay = startDateStr === endDateStr;

    // Check if this is a week range (approximately 7 days)
    const daysDiff = dayjs(endDate).diff(dayjs(startDate), "day");
    const isWeekRange = daysDiff >= 6 && daysDiff <= 7;

    // For week ranges, return current week + last week comparison
    if (isWeekRange) {
      const currentWeek = getCurrentWeekDates();
      const lastWeek = getLastWeekDates();

      // Fetch both weeks' stats in parallel (using daily cache aggregation)
      const [
        currentWeekStats,
        lastWeekStats,
        recentTransactions,
        topMerchantsRaw,
      ] = await Promise.all([
        this.aggregateStatsFromDailyCache(
          currentWeek.startDate,
          currentWeek.endDate,
        ),
        this.aggregateStatsFromDailyCache(lastWeek.startDate, lastWeek.endDate),
        // Recent 5 transactions for current week
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
            startDate: currentWeek.startDate,
            endDate: currentWeek.endDate,
          })
          .orderBy("payin.createdAt", "DESC")
          .limit(5)
          .getMany(),

        // Top 5 merchants for current week
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
            startDate: currentWeek.startDate,
            endDate: currentWeek.endDate,
          })
          .groupBy("payin.userId")
          .addGroupBy("user.fullName")
          .addGroupBy("user.email")
          .orderBy("SUM(payin.amount)", "DESC")
          .limit(5)
          .getRawMany(),
      ]);

      // Calculate percentage changes
      const payinPercentageChange = this.calculatePercentageChange(
        currentWeekStats.payin.successAmount,
        lastWeekStats.payin.successAmount,
      );

      const payoutPercentageChange = this.calculatePercentageChange(
        currentWeekStats.payout.successAmount,
        lastWeekStats.payout.successAmount,
      );

      const settlementPercentageChange = this.calculatePercentageChange(
        currentWeekStats.settlement.successAmount,
        lastWeekStats.settlement.successAmount,
      );

      return {
        currentWeek: {
          payin: {
            ...currentWeekStats.payin,
            percentageChange: payinPercentageChange,
          },
          payout: {
            ...currentWeekStats.payout,
            percentageChange: payoutPercentageChange,
          },
          settlement: {
            ...currentWeekStats.settlement,
            percentageChange: settlementPercentageChange,
          },
        },
        lastWeek: {
          payin: lastWeekStats.payin,
          payout: lastWeekStats.payout,
          settlement: lastWeekStats.settlement,
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
    }

    // For single day or custom date ranges, use normal flow
    if (isSingleDay) {
      const dailyStats = await this.fetchDailyStats(new Date(startDate));

      // Still need to fetch recent transactions and top merchants for the day
      const [recentTransactions, topMerchantsRaw] = await Promise.all([
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

      return {
        ...dailyStats,
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
    }

    // For multiple days (custom range), use daily cache aggregation for totals
    const aggregatedStats = await this.aggregateStatsFromDailyCache(
      new Date(startDate),
      new Date(endDate),
    );

    // Still need to fetch recent transactions and top merchants for the date range
    const [recentTransactions, topMerchantsRaw] = await Promise.all([
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

    return {
      ...aggregatedStats,
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
