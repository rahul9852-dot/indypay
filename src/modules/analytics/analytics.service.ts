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

  async getBusinessTrend(
    userId: string | null,
    { startDate = todayStartDate(), endDate = todayEndDate() }: DateDto,
  ) {
    this.logger.log(
      `Getting business trend for user ${userId} from ${startDate} to ${endDate}`,
    );

    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException("Start date cannot be after end date");
    }

    try {
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);

      this.logger.log(`Querying UPI transactions with params:
        userId: ${userId}
        startDate: ${startDateTime.toISOString()}
        endDate: ${endDateTime.toISOString()}
        paymentMethod: ${PAYMENT_METHOD.UPI}`);

      // First, let's check if we have any data at all
      const queryBuilder =
        this.payInOrdersRepository.createQueryBuilder("payInOrder");

      // Only add userId condition for merchant users
      if (userId) {
        queryBuilder.where("payInOrder.userId = :userId", { userId });
      }

      const dataCheck = await queryBuilder
        .select(["payInOrder.paymentMethod", "COUNT(*) as count"])
        .groupBy("payInOrder.paymentMethod")
        .getRawMany();

      this.logger.log(
        `Total records by payment method: ${JSON.stringify(dataCheck)}`,
      );

      // Get UPI transaction stats
      const upiQueryBuilder =
        this.payInOrdersRepository.createQueryBuilder("payInOrder");

      // Only add userId condition for merchant users
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
          // Today's stats
          `COUNT(CASE WHEN DATE(payInOrder.createdAt) = CURRENT_DATE AND payInOrder.status = '${PAYMENT_STATUS.SUCCESS}' THEN payInOrder.id END) as todaySuccessCount`,
          `COUNT(CASE WHEN DATE(payInOrder.createdAt) = CURRENT_DATE AND payInOrder.status = '${PAYMENT_STATUS.FAILED}' THEN payInOrder.id END) as todayFailedCount`,
          `SUM(CASE WHEN DATE(payInOrder.createdAt) = CURRENT_DATE AND payInOrder.status = '${PAYMENT_STATUS.SUCCESS}' THEN payInOrder.amount ELSE 0 END) as todayVolume`,
          // Yesterday's stats
          `COUNT(CASE WHEN DATE(payInOrder.createdAt) = CURRENT_DATE - INTERVAL '1 day' AND payInOrder.status = '${PAYMENT_STATUS.SUCCESS}' THEN payInOrder.id END) as yesterdaySuccessCount`,
          `COUNT(CASE WHEN DATE(payInOrder.createdAt) = CURRENT_DATE - INTERVAL '1 day' AND payInOrder.status = '${PAYMENT_STATUS.FAILED}' THEN payInOrder.id END) as yesterdayFailedCount`,
          `SUM(CASE WHEN DATE(payInOrder.createdAt) = CURRENT_DATE - INTERVAL '1 day' AND payInOrder.status = '${PAYMENT_STATUS.SUCCESS}' THEN payInOrder.amount ELSE 0 END) as yesterdayVolume`,
          // Last 7 days stats
          `COUNT(CASE WHEN payInOrder.createdAt >= CURRENT_DATE - INTERVAL '7 days' AND payInOrder.status = '${PAYMENT_STATUS.SUCCESS}' THEN payInOrder.id END) as last7DaysSuccessCount`,
          `COUNT(CASE WHEN payInOrder.createdAt >= CURRENT_DATE - INTERVAL '7 days' AND payInOrder.status = '${PAYMENT_STATUS.FAILED}' THEN payInOrder.id END) as last7DaysFailedCount`,
          `SUM(CASE WHEN payInOrder.createdAt >= CURRENT_DATE - INTERVAL '7 days' AND payInOrder.status = '${PAYMENT_STATUS.SUCCESS}' THEN payInOrder.amount ELSE 0 END) as last7DaysVolume`,
        ])
        .getRawOne();

      this.logger.log(`Raw UPI stats: ${JSON.stringify(upiStats, null, 2)}`);

      // Check if we have any data in the date range
      const dateRangeCheck = await this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .where("payInOrder.userId = :userId", { userId })
        .andWhere("payInOrder.createdAt >= :startDate", {
          startDate: startDateTime,
        })
        .andWhere("payInOrder.createdAt <= :endDate", { endDate: endDateTime })
        .select(["COUNT(*) as count"])
        .getRawOne();

      this.logger.log(
        `Total records in date range: ${dateRangeCheck?.count || 0}`,
      );

      // Check payment method values in database
      const paymentMethodCheck = await this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .select(["DISTINCT payInOrder.paymentMethod"])
        .getRawMany();

      this.logger.log(
        `Available payment methods in DB: ${JSON.stringify(paymentMethodCheck)}`,
      );

      // Log the query parameters for debugging
      const queryParams = {
        userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        paymentMethod: PAYMENT_METHOD.UPI,
      };
      this.logger.log(
        `Query parameters: ${JSON.stringify(queryParams, null, 2)}`,
      );

      // Calculate success rates
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

      // Convert string values to numbers
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

      this.logger.log(`Calculated success rates: 
      Overall: ${upiTrendStats.successRate}%
      Today: ${upiTrendStats.todaySuccessRate}%
      Yesterday: ${upiTrendStats.yesterdaySuccessRate}%
      Last 7 days: ${upiTrendStats.last7DaysSuccessRate}%`);

      const paymentMethodStats = [upiTrendStats];

      // Get overall transaction stats with pending status
      const overallQueryBuilder =
        this.payInOrdersRepository.createQueryBuilder("payInOrder");

      // Only add userId condition for merchant users
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

      // Calculate overall success and conversion rates with proper number conversion
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

      // Calculate hourly transaction volume for the last 24 hours
      const hourlyQueryBuilder =
        this.payInOrdersRepository.createQueryBuilder("payInOrder");

      // Only add userId condition for merchant users
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

      // Log the raw stats for debugging
      this.logger.log(
        `Payment method stats: ${JSON.stringify(paymentMethodStats)}`,
      );

      // Calculate totals with proper type conversion
      const totalSuccessfulTransactions =
        Number(overallStats.successcount) || 0;
      const totalTransactions = Number(overallStats.totalcount) || 0;
      const successRate =
        totalTransactions > 0
          ? (totalSuccessfulTransactions / totalTransactions) * 100
          : 0;

      this.logger.log(`Calculated totals: 
      Total transactions: ${totalTransactions}
      Successful transactions: ${totalSuccessfulTransactions}
      Success rate: ${successRate}%`);

      // Sort payment methods by success rate for accurate best/worst performer
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

      this.logger
        .log(`Best performer: ${bestPerformer.method} (${bestPerformer.successRate}%)
      Worst performer: ${worstPerformer.method} (${worstPerformer.successRate}%)`);

      // Log final calculated values
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

      this.logger.log(`Final response: ${JSON.stringify(response, null, 2)}`);

      return response;
    } catch (error) {
      this.logger.error(`Error in getBusinessTrend: ${error.message}`);
      this.logger.error(error.stack);
      throw error;
    }
  }

  async getAdminConversionRate({
    startDate = todayStartDate(),
    endDate = todayEndDate(),
  }: DateDto) {
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException("Start date cannot be after end date");
    }

    const payInStats = await Promise.all([
      // PayIn Stats - Total Amount
      this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .select("SUM(payInOrder.amount)", "total")
        .where("payInOrder.createdAt BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .getRawOne(),
      // PayIn Stats - Total Count
      this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .where("payInOrder.createdAt BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .getCount(),
      // Success Amount
      this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .select("SUM(payInOrder.amount)", "total")
        .where(
          "payInOrder.createdAt BETWEEN :startDate AND :endDate AND payInOrder.status = :status",
          {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: PAYMENT_STATUS.SUCCESS,
          },
        )
        .getRawOne(),
      // Success Count
      this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .where(
          "payInOrder.createdAt BETWEEN :startDate AND :endDate AND payInOrder.status = :status",
          {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: PAYMENT_STATUS.SUCCESS,
          },
        )
        .getCount(),
      // Failed Amount
      this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
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
      // Failed Count
      this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
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

    this.logger.log("PayIn stats:", payInStats);

    const [
      initiatedPayinAmountRaw,
      initiatedPayinCount,
      successPayinAmountRaw,
      successPayinCount,
      failedPayinAmountRaw,
      failedPayinCount,
    ] = payInStats;

    // Extract amounts from raw results
    const initiatedPayinAmount = initiatedPayinAmountRaw?.total || 0;
    const successPayinAmount = successPayinAmountRaw?.total || 0;
    const failedPayinAmount = failedPayinAmountRaw?.total || 0;

    this.logger.log("Parsed PayIn stats:", {
      initiatedPayinAmount,
      initiatedPayinCount,
      successPayinAmount,
      successPayinCount,
      failedPayinAmount,
      failedPayinCount,
    });

    // Avoid division by zero
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
      // PayIn Stats - Total Amount
      this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .select("SUM(payInOrder.amount)", "total")
        .where("payInOrder.user.id = :userId", { userId })
        .where("payInOrder.createdAt BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .getRawOne(),
      // PayIn Stats - Total Count
      this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .where("payInOrder.user.id = :userId", { userId })
        .where("payInOrder.createdAt BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })
        .getCount(),
      // Success Amount
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
      // Success Count
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
      // Failed Amount
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
      // Failed Count
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

    this.logger.log("PayIn stats:", payInStats);

    const [
      initiatedPayinAmountRaw,
      initiatedPayinCount,
      successPayinAmountRaw,
      successPayinCount,
      failedPayinAmountRaw,
      failedPayinCount,
    ] = payInStats;

    // Extract amounts from raw results
    const initiatedPayinAmount = initiatedPayinAmountRaw?.total || 0;
    const successPayinAmount = successPayinAmountRaw?.total || 0;
    const failedPayinAmount = failedPayinAmountRaw?.total || 0;

    this.logger.log("Parsed PayIn stats:", {
      initiatedPayinAmount,
      initiatedPayinCount,
      successPayinAmount,
      successPayinCount,
      failedPayinAmount,
      failedPayinCount,
    });

    // Avoid division by zero
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
      },
    };
  }

  async getPaymentMethodAnalytics(
    userId: string,
    { startDate = todayStartDate(), endDate = todayEndDate() }: DateDto,
  ) {
    // Validate date range
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
    // Validate date range
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

  async getAdminFailureAnalytics({
    startDate = todayStartDate(),
    endDate = todayEndDate(),
  }: DateDto) {
    // Validate date range
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException("Start date cannot be after end date");
    }

    const failedAnalytics = await Promise.all([
      // Intitiated count
      this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .where(
          "payInOrder.createdAt BETWEEN :startDate AND :endDate AND payInOrder.status = :status",
          {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: PAYMENT_STATUS.PENDING,
          },
        )
        .getCount(),

      // Failed Count
      this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .where(
          "payInOrder.createdAt BETWEEN :startDate AND :endDate AND payInOrder.status = :status",
          {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: PAYMENT_STATUS.FAILED,
          },
        )
        .getCount(),
      // Failed Volume
      this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
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
    // Validate date range
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException("Start date cannot be after end date");
    }

    const failedAnalytics = await Promise.all([
      // initated count
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
      // Failed Count
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
      // Failed Volume
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
        failedPercentage,
      },
    };
  }

  async getAdminSuccessAnalytics({
    startDate = todayStartDate(),
    endDate = todayEndDate(),
  }: DateDto) {}

  async getMerchantSuccessAnalytics(
    userId: string,
    { startDate = todayStartDate(), endDate = todayEndDate() }: DateDto,
  ) {
    // Validate date range
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException("Start date cannot be after end date");
    }
  }
}
