import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DateDto } from "@/dtos/common.dto";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { PAYMENT_METHOD } from "@/enums/payment-method.enum";
import { todayEndDate, todayStartDate } from "@/utils/date.utils";

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(PayInOrdersEntity)
    private readonly payInOrdersRepository: Repository<PayInOrdersEntity>,
    @InjectRepository(PayOutOrdersEntity)
    private readonly payOutOrdersRepository: Repository<PayOutOrdersEntity>,
  ) {}

  private async getAnalyticsMetrics(
    dateRange: { startDate: Date; endDate: Date },
    userId?: string,
    cpId?: string,
  ) {
    const baseQuery = this.payInOrdersRepository
      .createQueryBuilder("payInOrder")
      .where("payInOrder.createdAt BETWEEN :startDate AND :endDate", dateRange);

    if (cpId) {
      baseQuery.innerJoin("payInOrder.user", "user");
      baseQuery.andWhere("user.channelPartnerId = :cpId", { cpId });
    } else if (userId) {
      baseQuery.andWhere("payInOrder.userId = :userId", { userId });
    }

    const initiatedMetrics = await baseQuery
      .clone()
      .select([
        "COUNT(payInOrder.id) as count",
        "COALESCE(SUM(payInOrder.amount), 0) as volume",
      ])
      .getRawOne();

    const statusMetrics = await baseQuery
      .select([
        "payInOrder.status",
        "COUNT(payInOrder.id) as count",
        "COALESCE(SUM(payInOrder.amount), 0) as volume",
      ])
      .groupBy("payInOrder.status")
      .cache(true)
      .getRawMany();

    const upiMetrics = await baseQuery
      .clone()
      .select("COALESCE(SUM(payInOrder.amount), 0)", "volume")
      .andWhere("payInOrder.paymentMethod = :method", {
        method: PAYMENT_METHOD.UPI,
      })
      .andWhere("payInOrder.status = :status", {
        status: PAYMENT_STATUS.SUCCESS,
      })
      .getRawOne();

    const metrics = statusMetrics.reduce((acc, curr) => {
      acc[curr.payInOrder_status.toLowerCase()] = {
        count: parseInt(curr.count) || 0,
        volume: parseFloat(curr.volume) || 0,
      };

      return acc;
    }, {});

    const totalInitiated = {
      count: parseInt(initiatedMetrics.count) || 0,
      volume: parseFloat(initiatedMetrics.volume) || 0,
    };
    const success = metrics.success || { count: 0, volume: 0 };
    const pending = metrics.pending || { count: 0, volume: 0 };
    const failed = metrics.failed || { count: 0, volume: 0 };

    const calculatePercentage = (value: number, total: number): number => {
      if (!total || !value) return 0;
      const percentage = (value / total) * 100;

      return Number(Math.min(percentage, 100).toFixed(2));
    };

    return {
      counts: {
        initiated: totalInitiated.count,
        success: success.count,
        pending: pending.count,
        failed: failed.count,
      },
      volumes: {
        initiated: totalInitiated.volume,
        success: success.volume,
        upi: parseFloat(upiMetrics?.volume || "0"),
      },
      rates: {
        transactionSuccess: calculatePercentage(
          success.count,
          totalInitiated.count,
        ),
        orderSuccess: calculatePercentage(success.count, totalInitiated.count),
        decline: calculatePercentage(pending.count, totalInitiated.count),
        bankDecline: calculatePercentage(failed.count, totalInitiated.count),
        payboltDecline: calculatePercentage(failed.count, totalInitiated.count),
        upi: calculatePercentage(
          parseFloat(upiMetrics?.volume || "0"),
          success.volume,
        ),
      },
    };
  }

  async getBusinessTrend(
    userId: string | null,
    { startDate = todayStartDate(), endDate = todayEndDate() }: DateDto,
  ) {
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException("Start date cannot be after end date");
    }

    try {
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);

      const queryBuilder =
        this.payInOrdersRepository.createQueryBuilder("payInOrder");

      if (userId) {
        queryBuilder.where("payInOrder.userId = :userId", { userId });
      }

      const upiQueryBuilder =
        this.payInOrdersRepository.createQueryBuilder("payInOrder");

      if (userId) {
        upiQueryBuilder.where("payInOrder.userId = :userId", { userId });
      }

      const upiStats = await upiQueryBuilder
        .andWhere("payInOrder.createdAt >= :startDate", {
          startDate: startDateTime,
        })
        .andWhere("payInOrder.createdAt <= :endDate", { endDate: endDateTime })
        .andWhere("payInOrder.paymentMethod = :paymentMethod", {
          paymentMethod: PAYMENT_METHOD.UPI,
        })
        .select([
          "COUNT(payInOrder.id) as totalCount",
          `COUNT(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.SUCCESS}' THEN payInOrder.id END) as successCount`,
          `COUNT(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.FAILED}' THEN payInOrder.id END) as failedCount`,
          `COUNT(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.PENDING}' THEN payInOrder.id END) as pendingCount`,
          `SUM(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.SUCCESS}' THEN payInOrder.amount ELSE 0 END) as successAmount`,
          `SUM(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.FAILED}' THEN payInOrder.amount ELSE 0 END) as failedAmount`,
          `SUM(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.PENDING}' THEN payInOrder.amount ELSE 0 END) as pendingAmount`,
          `COUNT(CASE WHEN DATE(payInOrder.createdAt) = CURRENT_DATE AND payInOrder.status = '${PAYMENT_STATUS.SUCCESS}' THEN payInOrder.id END) as todaySuccessCount`,
          `COUNT(CASE WHEN DATE(payInOrder.createdAt) = CURRENT_DATE AND payInOrder.status = '${PAYMENT_STATUS.FAILED}' THEN payInOrder.id END) as todayFailedCount`,
          `SUM(CASE WHEN DATE(payInOrder.createdAt) = CURRENT_DATE AND payInOrder.status = '${PAYMENT_STATUS.SUCCESS}' THEN payInOrder.amount ELSE 0 END) as todayVolume`,
          `COUNT(CASE WHEN DATE(payInOrder.createdAt) = CURRENT_DATE - INTERVAL '1 day' AND payInOrder.status = '${PAYMENT_STATUS.SUCCESS}' THEN payInOrder.id END) as yesterdaySuccessCount`,
          `COUNT(CASE WHEN DATE(payInOrder.createdAt) = CURRENT_DATE - INTERVAL '1 day' AND payInOrder.status = '${PAYMENT_STATUS.FAILED}' THEN payInOrder.id END) as yesterdayFailedCount`,
          `SUM(CASE WHEN DATE(payInOrder.createdAt) = CURRENT_DATE - INTERVAL '1 day' AND payInOrder.status = '${PAYMENT_STATUS.SUCCESS}' THEN payInOrder.amount ELSE 0 END) as yesterdayVolume`,
          `COUNT(CASE WHEN payInOrder.createdAt >= CURRENT_DATE - INTERVAL '7 days' AND payInOrder.status = '${PAYMENT_STATUS.SUCCESS}' THEN payInOrder.id END) as last7DaysSuccessCount`,
          `COUNT(CASE WHEN payInOrder.createdAt >= CURRENT_DATE - INTERVAL '7 days' AND payInOrder.status = '${PAYMENT_STATUS.FAILED}' THEN payInOrder.id END) as last7DaysFailedCount`,
          `SUM(CASE WHEN payInOrder.createdAt >= CURRENT_DATE - INTERVAL '7 days' AND payInOrder.status = '${PAYMENT_STATUS.SUCCESS}' THEN payInOrder.amount ELSE 0 END) as last7DaysVolume`,
        ])
        .getRawOne();

      const upiTotalCount = Number(upiStats.totalcount) || 0;
      const upiSuccessCount = Number(upiStats.successcount) || 0;
      const todayTotal =
        (Number(upiStats.todaysuccesscount) || 0) +
        (Number(upiStats.todayfailedcount) || 0);
      const yesterdayTotal =
        (Number(upiStats.yesterdaysuccesscount) || 0) +
        (Number(upiStats.yesterdayfailedcount) || 0);
      const last7DaysTotal =
        (Number(upiStats.last7dayssuccesscount) || 0) +
        (Number(upiStats.last7daysfailedcount) || 0);

      const upiTrendStats = {
        method: PAYMENT_METHOD.UPI,
        totalcount: Number(upiStats.totalcount) || 0,
        successcount: Number(upiStats.successcount) || 0,
        failedcount: Number(upiStats.failedcount) || 0,
        pendingcount: Number(upiStats.pendingcount) || 0,
        successamount: Number(upiStats.successamount) || 0,
        failedamount: Number(upiStats.failedamount) || 0,
        pendingamount: Number(upiStats.pendingamount) || 0,
        todaySuccessCount: Number(upiStats.todaysuccesscount) || 0,
        todayFailedCount: Number(upiStats.todayfailedcount) || 0,
        todayVolume: Number(upiStats.todayvolume) || 0,
        yesterdaySuccessCount: Number(upiStats.yesterdaysuccesscount) || 0,
        yesterdayFailedCount: Number(upiStats.yesterdayfailedcount) || 0,
        yesterdayVolume: Number(upiStats.yesterdayvolume) || 0,
        last7DaysSuccessCount: Number(upiStats.last7dayssuccesscount) || 0,
        last7DaysFailedCount: Number(upiStats.last7daysfailedcount) || 0,
        last7DaysVolume: Number(upiStats.last7daysvolume) || 0,
        successRate:
          upiTotalCount > 0
            ? (Number(upiSuccessCount) / Number(upiTotalCount)) * 100
            : 0,
        todaySuccessRate:
          todayTotal > 0
            ? (Number(upiStats.todaysuccesscount) / todayTotal) * 100
            : 0,
        yesterdaySuccessRate:
          yesterdayTotal > 0
            ? (Number(upiStats.yesterdaysuccesscount) / yesterdayTotal) * 100
            : 0,
        last7DaysSuccessRate:
          last7DaysTotal > 0
            ? (Number(upiStats.last7dayssuccesscount) / last7DaysTotal) * 100
            : 0,
      };

      const paymentMethodStats = [upiTrendStats];
      const overallQueryBuilder =
        this.payInOrdersRepository.createQueryBuilder("payInOrder");

      if (userId) {
        overallQueryBuilder.where("payInOrder.userId = :userId", { userId });
      }

      const overallStats = await overallQueryBuilder
        .andWhere("payInOrder.createdAt >= :startDate", {
          startDate: startDateTime,
        })
        .andWhere("payInOrder.createdAt <= :endDate", { endDate: endDateTime })
        .select([
          "SUM(payInOrder.amount) as totalAmount",
          "COUNT(payInOrder.id) as totalCount",
          `SUM(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.SUCCESS}' THEN payInOrder.amount ELSE 0 END) as successAmount`,
          `COUNT(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.SUCCESS}' THEN payInOrder.id END) as successCount`,
          `SUM(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.FAILED}' THEN payInOrder.amount ELSE 0 END) as failedAmount`,
          `COUNT(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.FAILED}' THEN payInOrder.id END) as failedCount`,
          `SUM(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.PENDING}' THEN payInOrder.amount ELSE 0 END) as pendingAmount`,
          `COUNT(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.PENDING}' THEN payInOrder.id END) as pendingCount`,
        ])
        .getRawOne();

      const overallTotalCount = Number(overallStats.totalcount) || 0;
      const overallSuccessCount = Number(overallStats.successcount) || 0;
      const overallFailedCount = Number(overallStats.failedcount) || 0;
      const overallPendingCount = Number(overallStats.pendingcount) || 0;

      const overallRates = {
        successRate:
          overallTotalCount > 0
            ? (overallSuccessCount / overallTotalCount) * 100
            : 0,
        conversionRate:
          overallTotalCount > 0
            ? (overallSuccessCount / overallTotalCount) * 100
            : 0,
        failureRate:
          overallTotalCount > 0
            ? (overallFailedCount / overallTotalCount) * 100
            : 0,
        pendingRate:
          overallTotalCount > 0
            ? (overallPendingCount / overallTotalCount) * 100
            : 0,
      };

      const hourlyQueryBuilder =
        this.payInOrdersRepository.createQueryBuilder("payInOrder");

      if (userId) {
        hourlyQueryBuilder.where("payInOrder.userId = :userId", { userId });
      }

      const hourlyStats = await hourlyQueryBuilder
        .andWhere("payInOrder.createdAt >= :last24Hours", {
          last24Hours: new Date(Date.now() - 24 * 60 * 60 * 1000),
        })
        .andWhere("payInOrder.paymentMethod = :method", {
          method: PAYMENT_METHOD.UPI,
        })
        .select([
          "DATE_TRUNC('hour', payInOrder.createdAt) as hour",
          "COUNT(payInOrder.id) as count",
          `COUNT(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.SUCCESS}' THEN payInOrder.id END) as successCount`,
          `SUM(payInOrder.amount) as volume`,
        ])
        .groupBy("hour")
        .orderBy("hour", "ASC")
        .getRawMany();

      const totalSuccessfulTransactions =
        Number(overallStats.successcount) || 0;
      const totalTransactions = Number(overallStats.totalcount) || 0;
      const successRate =
        totalTransactions > 0
          ? (totalSuccessfulTransactions / totalTransactions) * 100
          : 0;

      const sortedStats = [...paymentMethodStats].sort(
        (a, b) => (b.successRate || 0) - (a.successRate || 0),
      );

      const bestPerformer = sortedStats[0] || {
        method: PAYMENT_METHOD.UPI,
        successRate: 0,
      };
      const worstPerformer = sortedStats[sortedStats.length - 1] || {
        method: PAYMENT_METHOD.UPI,
        successRate: 0,
      };

      const response = {
        summary: {
          successfulTransactionsRate: Number(successRate) || 0,
          numberOfSuccessfulTransactions:
            Number(totalSuccessfulTransactions) || 0,
          volumeOfTransactions: Number(overallStats.successamount) || 0,
        },
        insights: {
          successRate: Number(successRate) || 0,
          numberOfTransactions: Number(totalSuccessfulTransactions) || 0,
          highestPaymentMethodSuccessRate: PAYMENT_METHOD.UPI,
          lowestPaymentMethod: PAYMENT_METHOD.UPI,
          totalSuccessGrossVolume: Number(overallStats.successamount) || 0,
        },
        tableData: [
          {
            paymentMethod: PAYMENT_METHOD.UPI,
            successRatioToday: Number(upiTrendStats.todaySuccessRate) || 0,
            successRatioYesterday:
              Number(upiTrendStats.yesterdaySuccessRate) || 0,
            averageSuccessRatio:
              Number(upiTrendStats.last7DaysSuccessRate) || 0,
            successToday: Number(upiTrendStats.todaySuccessCount) || 0,
            successYesterday: Number(upiTrendStats.yesterdaySuccessCount) || 0,
            averageVolume: Number(upiTrendStats.last7DaysVolume)
              ? Number(upiTrendStats.last7DaysVolume) / 7
              : 0,
          },
        ],
      };

      return response;
    } catch (error) {
      this.logger.error(`Error in getBusinessTrend: ${error.message}`);
      this.logger.error(error.stack);
      throw error;
    }
  }

  async getAdminConversionRate(
    { startDate = todayStartDate(), endDate = todayEndDate() }: DateDto,
    cpId?: string,
  ) {
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException("Start date cannot be after end date");
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    const getPayInQueryBuilder = () => {
      const qb = this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .where("payInOrder.createdAt BETWEEN :startDate AND :endDate", {
          startDate: startDateTime,
          endDate: endDateTime,
        });

      if (cpId) {
        qb.innerJoin("payInOrder.user", "user").andWhere(
          "user.channelPartnerId = :cpId",
          { cpId },
        );
      }

      return qb;
    };

    const payInStats = await Promise.all([
      getPayInQueryBuilder()
        .select("SUM(payInOrder.amount)", "total")
        .getRawOne(), // total amount
      getPayInQueryBuilder().getCount(), // total count
      getPayInQueryBuilder()
        .andWhere("payInOrder.status = :status", {
          status: PAYMENT_STATUS.SUCCESS,
        })
        .select("SUM(payInOrder.amount)", "total")
        .getRawOne(), // success amount
      getPayInQueryBuilder()
        .andWhere("payInOrder.status = :status", {
          status: PAYMENT_STATUS.SUCCESS,
        })
        .getCount(), // success count
      getPayInQueryBuilder()
        .andWhere("payInOrder.status = :status", {
          status: PAYMENT_STATUS.FAILED,
        })
        .select("SUM(payInOrder.amount)", "total")
        .getRawOne(), // failed amount
      getPayInQueryBuilder()
        .andWhere("payInOrder.status = :status", {
          status: PAYMENT_STATUS.FAILED,
        })
        .getCount(), // failed count
    ]);

    const [
      initiatedPayinAmountRaw,
      initiatedPayinCount,
      successPayinAmountRaw,
      successPayinCount,
      failedPayinAmountRaw,
      failedPayinCount,
    ] = payInStats;

    const initiatedPayinAmount = initiatedPayinAmountRaw?.total || 0;
    const successPayinAmount = successPayinAmountRaw?.total || 0;
    const failedPayinAmount = failedPayinAmountRaw?.total || 0;

    const totalCount = initiatedPayinCount || 1;

    const numberOfOrdersCreated = initiatedPayinCount;
    const numberOfOrdersAttempted = (failedPayinCount / totalCount) * 100;
    const numberOfOrdersPaid = (successPayinCount / totalCount) * 100;
    const ordersConversionRate = (successPayinCount / totalCount) * 100;

    return {
      conversionRate: {
        numberOfOrdersCreated,
        numberOfOrdersAttempted,
        numberOfOrdersPaid,
        ordersConversionRate,
        successPayinAmount,
        failedPayinAmount,
      },
    };
  }

  async getMerchantConversionRate(
    userId: string,
    { startDate = todayStartDate(), endDate = todayEndDate() }: DateDto,
  ) {
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException("Start date cannot be after end date");
    }

    const payInStats = await Promise.all([
      this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .select("SUM(payInOrder.amount)", "total")
        .where("payInOrder.user.id = :userId", { userId })
        .where("payInOrder.createdAt BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .getRawOne(),
      this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .where("payInOrder.user.id = :userId", { userId })
        .where("payInOrder.createdAt BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .getCount(),
      this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .select("SUM(payInOrder.amount)", "total")
        .where("payInOrder.user.id = :userId", { userId })
        .where(
          "payInOrder.createdAt BETWEEN :startDate AND :endDate AND payInOrder.status = :status",
          {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: PAYMENT_STATUS.SUCCESS,
          },
        )
        .getRawOne(),
      this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .where("payInOrder.user.id = :userId", { userId })
        .where(
          "payInOrder.createdAt BETWEEN :startDate AND :endDate AND payInOrder.status = :status",
          {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: PAYMENT_STATUS.SUCCESS,
          },
        )
        .getCount(),
      this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .where("payInOrder.user.id = :userId", { userId })
        .select("SUM(payInOrder.amount)", "total")
        .where(
          "payInOrder.createdAt BETWEEN :startDate AND :endDate AND payInOrder.status = :status",
          {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: PAYMENT_STATUS.FAILED,
          },
        )
        .getRawOne(),
      this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .where("payInOrder.user.id = :userId", { userId })
        .where(
          "payInOrder.createdAt BETWEEN :startDate AND :endDate AND payInOrder.status = :status",
          {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: PAYMENT_STATUS.FAILED,
          },
        )
        .getCount(),
    ]);

    const [
      initiatedPayinAmountRaw,
      initiatedPayinCount,
      successPayinAmountRaw,
      successPayinCount,
      failedPayinAmountRaw,
      failedPayinCount,
    ] = payInStats;

    const totalCount = initiatedPayinCount || 1;

    const numberOfOrdersCreated = initiatedPayinCount;
    const numberOfOrdersAttempted = Number(
      (failedPayinCount / totalCount) * 100,
    );
    const numberOfOrdersPaid = Number((successPayinCount / totalCount) * 100);
    const ordersConversionRate = Number((successPayinCount / totalCount) * 100);

    return {
      conversionRate: {
        numberOfOrdersCreated,
        numberOfOrdersAttempted,
        numberOfOrdersPaid,
        ordersConversionRate,
      },
    };
  }

  async getPaymentMethodAnalytics(
    userId: string,
    { startDate = todayStartDate(), endDate = todayEndDate() }: DateDto,
  ) {
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException("Start date cannot be after end date");
    }

    const stats = await this.payInOrdersRepository
      .createQueryBuilder("payInOrder")
      .where("payInOrder.userId = :userId", { userId })
      .andWhere("payInOrder.createdAt BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .andWhere("payInOrder.paymentMethod = :paymentMethod", {
        paymentMethod: PAYMENT_METHOD.UPI,
      })
      .select([
        "payInOrder.paymentMethod",
        "COUNT(payInOrder.id) as totalCount",
        `COUNT(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.SUCCESS}' THEN payInOrder.id END) as successCount`,
        `COUNT(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.FAILED}' THEN payInOrder.id END) as failedCount`,
        `COUNT(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.PENDING}' THEN payInOrder.id END) as pendingCount`,
        `SUM(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.SUCCESS}' THEN payInOrder.amount ELSE 0 END) as successVolume`,
        `SUM(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.FAILED}' THEN payInOrder.amount ELSE 0 END) as failedVolume`,
        `SUM(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.PENDING}' THEN payInOrder.amount ELSE 0 END) as pendingVolume`,
      ])
      .groupBy("payInOrder.paymentMethod")
      .getRawMany();

    return stats.map((stat) => ({
      method: stat.paymentMethod || "Unknown",
      totalTransactions: stat.totalCount || 0,
      successfulTransactions: stat.successCount || 0,
      failedTransactions: stat.failedCount || 0,
      pendingTransactions: stat.pendingCount || 0,
      successVolume: stat.successVolume || 0,
      failedVolume: stat.failedVolume || 0,
      pendingVolume: stat.pendingVolume || 0,
      successRate:
        stat.totalCount > 0 ? (stat.successCount / stat.totalCount) * 100 : 0,
      failureRate:
        stat.totalCount > 0 ? (stat.failedCount / stat.totalCount) * 100 : 0,
      pendingRate:
        stat.totalCount > 0 ? (stat.pendingCount / stat.totalCount) * 100 : 0,
    }));
  }

  async getHourlyAnalytics(
    userId: string,
    { startDate = todayStartDate(), endDate = todayEndDate() }: DateDto,
  ) {
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException("Start date cannot be after end date");
    }

    return this.payInOrdersRepository
      .createQueryBuilder("payInOrder")
      .where("payInOrder.userId = :userId", { userId })
      .andWhere("payInOrder.createdAt BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .select([
        "DATE_TRUNC('hour', payInOrder.createdAt) as hour",
        "COUNT(payInOrder.id) as totalCount",
        `COUNT(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.SUCCESS}' THEN payInOrder.id END) as successCount`,
        `COUNT(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.FAILED}' THEN payInOrder.id END) as failedCount`,
        `COUNT(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.PENDING}' THEN payInOrder.id END) as pendingCount`,
        `SUM(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.SUCCESS}' THEN payInOrder.amount ELSE 0 END) as successVolume`,
        `SUM(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.FAILED}' THEN payInOrder.amount ELSE 0 END) as failedVolume`,
        `SUM(CASE WHEN payInOrder.status = '${PAYMENT_STATUS.PENDING}' THEN payInOrder.amount ELSE 0 END) as pendingVolume`,
      ])
      .groupBy("hour")
      .orderBy("hour", "ASC")
      .getRawMany();
  }

  async getAdminFailureAnalytics(
    { startDate = todayStartDate(), endDate = todayEndDate() }: DateDto,
    cpId?: string,
  ) {
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException("Start date cannot be after end date");
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    const getPayInQueryBuilder = () => {
      const qb = this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .where("payInOrder.createdAt BETWEEN :startDate AND :endDate", {
          startDate: startDateTime,
          endDate: endDateTime,
        });

      if (cpId) {
        qb.innerJoin("payInOrder.user", "user").andWhere(
          "user.channelPartnerId = :cpId",
          { cpId },
        );
      }

      return qb;
    };

    const failedAnalytics = await Promise.all([
      getPayInQueryBuilder()
        .andWhere("payInOrder.status = :status", {
          status: PAYMENT_STATUS.PENDING,
        })
        .getCount(),
      getPayInQueryBuilder()
        .andWhere("payInOrder.status = :status", {
          status: PAYMENT_STATUS.FAILED,
        })
        .getCount(),
      getPayInQueryBuilder()
        .andWhere("payInOrder.status = :status", {
          status: PAYMENT_STATUS.FAILED,
        })
        .select("SUM(payInOrder.amount)", "total")
        .getRawOne(),
    ]);

    const [initiatedCount, failedCount, failedVolume] = failedAnalytics;

    const failedPercentage = (failedCount / initiatedCount) * 100;

    return {
      failedAnalytics: {
        failedVolume: failedVolume.total,
        failedCount,
        failedPercentage,
      },
    };
  }

  async getMerchantFailureAnalytics(
    userId: string,
    { startDate = todayStartDate(), endDate = todayEndDate() }: DateDto,
  ) {
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException("Start date cannot be after end date");
    }

    const failedAnalytics = await Promise.all([
      this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .where("payInOrder.userId = :userId", { userId })
        .andWhere(
          "payInOrder.createdAt BETWEEN :startDate AND :endDate AND payInOrder.status = :status",
          {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: PAYMENT_STATUS.PENDING,
          },
        )
        .getCount(),
      this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .where("payInOrder.userId = :userId", { userId })
        .andWhere(
          "payInOrder.createdAt BETWEEN :startDate AND :endDate AND payInOrder.status = :status",
          {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: PAYMENT_STATUS.FAILED,
          },
        )
        .getCount(),
      this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .select("SUM(payInOrder.amount)", "total")
        .where("payInOrder.userId = :userId", { userId })
        .andWhere(
          "payInOrder.createdAt BETWEEN :startDate AND :endDate AND payInOrder.status = :status",
          {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: PAYMENT_STATUS.FAILED,
          },
        )
        .getRawOne(),
    ]);

    const [initiatedCount, failedCount, failedVolume] = failedAnalytics;

    const failedPercentage = (failedCount / initiatedCount) * 100;

    return {
      failedAnalytics: {
        failedVolume,
        failedCount,
        failedPercentage: Number(failedPercentage.toFixed(2)),
      },
    };
  }

  async getAdminSuccessAnalytics(
    { startDate = todayStartDate(), endDate = todayEndDate() }: DateDto,
    cpId?: string,
  ) {
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException("Start date cannot be after end date");
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const metrics = await this.getAnalyticsMetrics(dateRange, undefined, cpId);

    return {
      successAnalytics: {
        successVolume: metrics.volumes.success,
        successCount: metrics.counts.success,
        transactionSuccessRate: metrics.rates.transactionSuccess,
        orderSuccessRate: metrics.rates.orderSuccess,
        declineRate: metrics.rates.decline,
      },
      systemHealth: this.getSystemHealthMetrics(),
      summary: {
        paymentMode: "UPI",
        transactionCount: metrics.counts.initiated,
        successPercentage: metrics.rates.transactionSuccess,
        declinePercentage: metrics.rates.decline,
        bankDeclinePercentage: metrics.rates.bankDecline,
        payboltDeclinePercentage: metrics.rates.payboltDecline,
      },
      paymentMode: {
        upiPercentage: metrics.rates.upi,
      },
    };
  }

  getSystemUptime() {
    const uptimeInSeconds = process.uptime();
    const uptimeInDays = Math.floor(uptimeInSeconds / (24 * 60 * 60));
    const uptimeInHours = Math.floor(
      (uptimeInSeconds % (24 * 60 * 60)) / (60 * 60),
    );
    const uptimeInMinutes = Math.floor((uptimeInSeconds % (60 * 60)) / 60);
    const uptimeInSecondsRemaining = Math.floor(uptimeInSeconds % 60);

    const startTime = new Date(Date.now() - uptimeInSeconds * 1000);
    const memoryUsage = process.memoryUsage();

    return {
      uptime: {
        days: uptimeInDays,
        hours: uptimeInHours,
        minutes: uptimeInMinutes,
        seconds: uptimeInSecondsRemaining,
        totalSeconds: uptimeInSeconds,
        startTime: startTime.toISOString(),
      },
      memory: {
        heapUsed: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100, // MB
        heapTotal:
          Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100, // MB
        rss: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100, // MB
      },
    };
  }

  private getSystemHealthMetrics() {
    const uptimeInSeconds = process.uptime();
    const now = new Date();
    const startTime = new Date(now.getTime() - uptimeInSeconds * 1000);

    // Calculate uptime percentage (assuming last 30 days)
    const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
    const uptimePercentage = Math.min(
      (uptimeInSeconds / thirtyDaysInSeconds) * 100,
      100,
    );

    const memoryUsage = process.memoryUsage();
    const memoryMetrics = {
      heapUsed: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotal: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
      rss: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
    };

    const uptimeText = this.formatUptimeDuration(uptimeInSeconds);

    return {
      status: "operational",
      uptime: {
        percentage: Number(uptimePercentage.toFixed(2)),
        duration: uptimeText,
        lastRestart: startTime.toISOString(),
      },
      performance: {
        memory: memoryMetrics,
        api: "healthy",
        timestamp: now.toISOString(),
      },
    };
  }

  private formatUptimeDuration(seconds: number): string {
    if (seconds < 60) return "Just started";

    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    } else {
      return `${minutes} minute${minutes > 1 ? "s" : ""}`;
    }
  }

  async getMerchantSuccessAnalytics(
    userId: string,
    { startDate = todayStartDate(), endDate = todayEndDate() }: DateDto,
  ) {
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException("Start date cannot be after end date");
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const metrics = await this.getAnalyticsMetrics(dateRange, userId);

    return {
      successAnalytics: {
        successVolume: metrics.volumes.success,
        successCount: metrics.counts.success,
        transactionSuccessRate: metrics.rates.transactionSuccess,
        orderSuccessRate: metrics.rates.orderSuccess,
        declineRate: metrics.rates.decline,
      },
      systemHealth: this.getSystemHealthMetrics(),
      summary: {
        paymentMode: "UPI",
        transactionCount: metrics.counts.initiated,
        successPercentage: metrics.rates.transactionSuccess,
        declinePercentage: metrics.rates.decline,
        bankDeclinePercentage: metrics.rates.bankDecline,
        payboltDeclinePercentage: metrics.rates.payboltDecline,
      },
      paymentMode: {
        upiPercentage: metrics.rates.upi,
      },
    };
  }
}
