import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Between,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from "typeorm";
import { UsersEntity } from "@/entities/user.entity";
import {
  DateDto,
  MessageResponseDto,
  PaginationDto,
  PaginationWithDateDto,
  PaginationWithoutSortAndOrderDto,
} from "@/dtos/common.dto";
import { USERS_ROLE } from "@/enums";
import { getPagination } from "@/utils/pagination.utils";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { SettlementsEntity } from "@/entities/settlements.entity";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import { todayEndDate, todayStartDate } from "@/utils/date.utils";
import { PAYMENT_METHOD } from "@/enums/payment-method.enum";

@Injectable()
export class ChannelPartnersService {
  private readonly logger = new Logger(ChannelPartnersService.name);
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(PayInOrdersEntity)
    private readonly payInOrdersRepository: Repository<PayInOrdersEntity>,
    @InjectRepository(PayOutOrdersEntity)
    private readonly payOutOrdersRepository: Repository<PayOutOrdersEntity>,
    @InjectRepository(SettlementsEntity)
    private readonly settlementsRepository: Repository<SettlementsEntity>,
  ) {}

  async getAllMerchants(
    {
      limit = 10,
      page = 1,
      search = "",
      sort = "id",
      order = "DESC",
    }: PaginationDto,
    cpId: string,
  ) {
    const [data, totalItems] = await this.usersRepository.findAndCount({
      where: {
        role: USERS_ROLE.MERCHANT,
        channelPartnerId: cpId,
        ...(search && {
          fullName: ILike(`%${search}%`),
        }),
      },
      skip: (page - 1) * limit,
      take: limit,
      order: {
        [sort]: order,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobile: true,
        accountStatus: true,
        channelPartnerId: true,
        createdAt: true,
        updatedAt: true,
      },
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

  async getMerchantByIdCP(id: string, cpId: string) {
    return await this.usersRepository.findOne({
      where: {
        id,
        role: USERS_ROLE.MERCHANT,
        channelPartnerId: cpId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobile: true,
        accountStatus: true,
        channelPartnerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getAllCollectionsGroupByUserCP(
    { limit = 10, page = 1, search = "" }: PaginationWithoutSortAndOrderDto,
    cpId: string,
  ) {
    const query = this.usersRepository
      .createQueryBuilder("user")
      .where(
        "user.role = :role AND user.channelPartnerId = :cpId AND (user.fullName ILIKE :search OR user.email ILIKE :search)",
        {
          role: USERS_ROLE.MERCHANT,
          cpId,
          search: `%${search}%`,
        },
      )
      .leftJoin("user.payInOrders", "payin")
      .select([
        "user.id",

        // Total initiated amount
        'COALESCE(SUM(payin.amount), 0) as "initiatedTotalAmount"',
        'COALESCE(SUM(CASE WHEN payin.status = :successStatus THEN payin.amount ELSE 0.00 END), 0) as "successTotalAmount"',
        'COALESCE(SUM(CASE WHEN payin.status = :failedStatus THEN payin.amount ELSE 0.00 END), 0) as "failedTotalAmount"',
        'COALESCE(SUM(CASE WHEN payin.status = :pendingStatus THEN payin.amount ELSE 0.00 END), 0) as "pendingTotalAmount"',

        // Total commission amount
        'COALESCE(SUM(payin.commissionAmount), 0) as "initiatedCommissionAmount"',
        'COALESCE(SUM(CASE WHEN payin.status = :successStatus THEN payin.commissionAmount ELSE 0.00 END), 0) as "successCommissionAmount"',
        'COALESCE(SUM(CASE WHEN payin.status = :failedStatus THEN payin.commissionAmount ELSE 0.00 END), 0) as "failedCommissionAmount"',
        'COALESCE(SUM(CASE WHEN payin.status = :pendingStatus THEN payin.commissionAmount ELSE 0.00 END), 0) as "pendingCommissionAmount"',

        // Total gst amount
        'COALESCE(SUM(payin.gstAmount), 0) as "initiatedGstAmount"',
        'COALESCE(SUM(CASE WHEN payin.status = :successStatus THEN payin.gstAmount ELSE 0.00 END), 0) as "successGstAmount"',
        'COALESCE(SUM(CASE WHEN payin.status = :failedStatus THEN payin.gstAmount ELSE 0.00 END), 0) as "failedGstAmount"',
        'COALESCE(SUM(CASE WHEN payin.status = :pendingStatus THEN payin.gstAmount ELSE 0.00 END), 0) as "pendingGstAmount"',

        // Total Net Payable amount
        'COALESCE(SUM(payin.netPayableAmount), 0) as "initiatedNetPayableAmount"',
        'COALESCE(SUM(CASE WHEN payin.status = :successStatus THEN payin.netPayableAmount ELSE 0.00 END), 0) as "successNetPayableAmount"',
        'COALESCE(SUM(CASE WHEN payin.status = :failedStatus THEN payin.netPayableAmount ELSE 0.00 END), 0) as "failedNetPayableAmount"',
        'COALESCE(SUM(CASE WHEN payin.status = :pendingStatus THEN payin.netPayableAmount ELSE 0.00 END), 0) as "pendingNetPayableAmount"',

        // count: total initiated payin
        'COUNT(payin.id) as "initiatedTotalCount"',
        'COUNT(CASE WHEN payin.status = :successStatus THEN payin.id ELSE NULL END) as "successCount"',
        'COUNT(CASE WHEN payin.status = :failedStatus THEN payin.id ELSE NULL END) as "failedCount"',
        'COUNT(CASE WHEN payin.status = :pendingStatus THEN payin.id ELSE NULL END) as "pendingCount"',
      ])
      .groupBy("user.id")
      .addSelect("user.id", "id")
      .addSelect("user.fullName", "fullName")
      .addSelect("user.email", "email")
      .setParameter("successStatus", PAYMENT_STATUS.SUCCESS)
      .setParameter("failedStatus", PAYMENT_STATUS.FAILED)
      .setParameter("pendingStatus", PAYMENT_STATUS.PENDING);

    const { raw: data } = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getRawAndEntities();

    const totalItems = await query.getCount();

    const pagination = getPagination({
      page,
      limit,
      totalItems,
    });

    return {
      data,
      pagination,
    };
  }

  async getAllCollectsByMerchantIdCP(
    {
      limit = 10,
      page = 1,
      search = "",
      sort = "id",
      order = "DESC",
    }: PaginationDto,
    { startDate = todayStartDate(), endDate = todayEndDate() }: DateDto,
    merchantId: string,
    cpId: string,
  ) {
    const [collections, totalItems] =
      await this.payInOrdersRepository.findAndCount({
        where: {
          user: {
            id: merchantId,
            channelPartnerId: cpId,
            role: USERS_ROLE.MERCHANT,
          },
          orderId: ILike(`%${search}%`),
          createdAt: Between(new Date(startDate), new Date(endDate)),
        },
        relations: {
          user: true,
        },
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

    const data = collections.map((item) => {
      return {
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        user: {
          id: item.user.id,
          fullName: item.user.fullName,
          email: item.user.email,
          mobile: item.user.mobile,
        },
      };
    });

    return {
      data,
      pagination,
    };
  }

  async getCollectionByIdCP(payinId: string, cpId: string) {
    return await this.payInOrdersRepository.findOne({
      where: { id: Number(payinId), user: { channelPartnerId: cpId } },
      relations: {
        user: true,
      },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        txnRefId: true,
        orderId: true,
        netPayableAmount: true,
        settlementStatus: true,
        user: {
          id: true,
          fullName: true,
          email: true,
          mobile: true,
          createdAt: true,
        },
      },
    });
  }

  async getStatsForCP(
    cpId: string,
    { startDate = todayStartDate(), endDate = todayEndDate() }: DateDto,
  ) {
    const [payinStats, settlementStats, payoutStats] = await Promise.all([
      // PayIn Stats
      Promise.all([
        this.payInOrdersRepository.sum("amount", {
          user: { channelPartnerId: cpId },
          createdAt: Between(new Date(startDate), new Date(endDate)),
        }),
        this.payInOrdersRepository.count({
          where: {
            user: { channelPartnerId: cpId },
            createdAt: Between(new Date(startDate), new Date(endDate)),
          },
        }),
        this.payInOrdersRepository.sum("amount", {
          status: PAYMENT_STATUS.SUCCESS,
          user: { channelPartnerId: cpId },
          createdAt: Between(new Date(startDate), new Date(endDate)),
        }),
        this.payInOrdersRepository.count({
          where: {
            status: PAYMENT_STATUS.SUCCESS,
            user: { channelPartnerId: cpId },
            createdAt: Between(new Date(startDate), new Date(endDate)),
          },
        }),
        this.payInOrdersRepository.sum("amount", {
          status: PAYMENT_STATUS.FAILED,
          user: { channelPartnerId: cpId },
          createdAt: Between(new Date(startDate), new Date(endDate)),
        }),
        this.payInOrdersRepository.count({
          where: {
            status: PAYMENT_STATUS.FAILED,
            user: { channelPartnerId: cpId },
            createdAt: Between(new Date(startDate), new Date(endDate)),
          },
        }),
      ]),
      // Settlement Stats
      Promise.all([
        this.settlementsRepository.sum("amountAfterDeduction", {
          user: { channelPartnerId: cpId },
          createdAt: Between(new Date(startDate), new Date(endDate)),
        }),
        this.settlementsRepository.count({
          where: {
            user: { channelPartnerId: cpId },
            createdAt: Between(new Date(startDate), new Date(endDate)),
          },
        }),
        this.settlementsRepository.sum("amountAfterDeduction", {
          status: PAYMENT_STATUS.SUCCESS,
          user: { channelPartnerId: cpId },
          createdAt: Between(new Date(startDate), new Date(endDate)),
        }),
        this.settlementsRepository.count({
          where: {
            status: PAYMENT_STATUS.SUCCESS,
            user: { channelPartnerId: cpId },
            createdAt: Between(new Date(startDate), new Date(endDate)),
          },
        }),
        this.settlementsRepository.sum("amountAfterDeduction", {
          status: PAYMENT_STATUS.FAILED,
          user: { channelPartnerId: cpId },
          createdAt: Between(new Date(startDate), new Date(endDate)),
        }),
        this.settlementsRepository.count({
          where: {
            status: PAYMENT_STATUS.FAILED,
            user: { channelPartnerId: cpId },
            createdAt: Between(new Date(startDate), new Date(endDate)),
          },
        }),
      ]),
      // Payout Stats
      Promise.all([
        this.payOutOrdersRepository.sum("amount", {
          user: { channelPartnerId: cpId },
          createdAt: Between(new Date(startDate), new Date(endDate)),
        }),
        this.payOutOrdersRepository.count({
          where: {
            user: { channelPartnerId: cpId },
            createdAt: Between(new Date(startDate), new Date(endDate)),
          },
        }),
        this.payOutOrdersRepository.sum("amount", {
          status: PAYMENT_STATUS.SUCCESS,
          user: { channelPartnerId: cpId },
          createdAt: Between(new Date(startDate), new Date(endDate)),
        }),
        this.payOutOrdersRepository.count({
          where: {
            status: PAYMENT_STATUS.SUCCESS,
            user: { channelPartnerId: cpId },
            createdAt: Between(new Date(startDate), new Date(endDate)),
          },
        }),
        this.payOutOrdersRepository.sum("amount", {
          status: PAYMENT_STATUS.FAILED,
          user: { channelPartnerId: cpId },
          createdAt: Between(new Date(startDate), new Date(endDate)),
        }),
        this.payOutOrdersRepository.count({
          where: {
            status: PAYMENT_STATUS.FAILED,
            user: { channelPartnerId: cpId },
            createdAt: Between(new Date(startDate), new Date(endDate)),
          },
        }),
      ]),
    ]);

    const [
      totalAmount,
      totalCount,
      successAmount,
      successCount,
      failedAmount,
      failedCount,
    ] = payinStats;

    const [
      initiatedSettlementAmount,
      initiatedSettlementCount,
      successSettlementAmount,
      successSettlementCount,
      failedSettlementAmount,
      failedSettlementCount,
    ] = settlementStats;

    const [
      initiatedPayoutAmount,
      initiatedPayoutCount,
      successPayoutAmount,
      successPayoutCount,
      failedPayoutAmount,
      failedPayoutCount,
    ] = payoutStats;

    return {
      payin: {
        totalAmount,
        totalCount,
        successAmount,
        successCount,
        failedAmount,
        failedCount,
      },
      payout: {
        totalAmount: initiatedPayoutAmount,
        totalCount: initiatedPayoutCount,
        successAmount: successPayoutAmount,
        successCount: successPayoutCount,
        failedAmount: failedPayoutAmount,
        failedCount: failedPayoutCount,
      },
      settlement: {
        totalAmount: initiatedSettlementAmount,
        totalCount: initiatedSettlementCount,
        successAmount: successSettlementAmount,
        successCount: successSettlementCount,
        failedAmount: failedSettlementAmount,
        failedCount: failedSettlementCount,
      },
    };
  }

  async getBusinessTrendForCP(
    cpId: string,
    { startDate = todayStartDate(), endDate = todayEndDate() }: DateDto,
  ) {
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException("Start date cannot be after end date");
    }

    try {
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);

      const queryBuilder = this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .innerJoin("payInOrder.user", "user");

      queryBuilder.where("user.channelPartnerId = :cpId", { cpId });

      const upiQueryBuilder = this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .innerJoin("payInOrder.user", "user");

      upiQueryBuilder.where("user.channelPartnerId = :cpId", {
        cpId,
      });

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
      const overallQueryBuilder = this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .innerJoin("payInOrder.user", "user");

      overallQueryBuilder.where("user.channelPartnerId = :cpId", {
        cpId,
      });

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

      const hourlyQueryBuilder = this.payInOrdersRepository
        .createQueryBuilder("payInOrder")
        .innerJoin("payInOrder.user", "user");

      hourlyQueryBuilder.where("user.channelPartnerId = :cpId", {
        cpId,
      });

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

  async findAllSettlementsTransactionsCP(
    {
      limit = 10,
      page = 1,
      order = "DESC",
      sort = "id",
      search = "",
      startDate,
      endDate,
    }: PaginationWithDateDto,
    user: UsersEntity,
  ) {
    // for admin user
    if (
      [USERS_ROLE.ADMIN, USERS_ROLE.OWNER, USERS_ROLE.CHANNEL_PARTNER].includes(
        user.role,
      )
    ) {
      const isCP = USERS_ROLE.CHANNEL_PARTNER === user.role;
      const whereQuery:
        | FindOptionsWhere<SettlementsEntity>
        | FindOptionsWhere<SettlementsEntity>[] = {};

      // Date Filter
      if (startDate && endDate) {
        whereQuery.createdAt = Between(new Date(startDate), new Date(endDate));
      } else if (startDate) {
        whereQuery.createdAt = MoreThanOrEqual(new Date(startDate));
      } else if (endDate) {
        whereQuery.createdAt = LessThanOrEqual(new Date(endDate));
      }

      const query = [whereQuery];

      if (search) {
        query.push({
          transferId: ILike(`%${search}%`),
        });
        query.push({
          user: {
            fullName: ILike(`%${search}%`),
            ...(isCP && { channelPartnerId: user.id }),
          },
        });
      }

      if (isCP) {
        query.push({
          user: {
            channelPartnerId: user.id,
          },
        });
      }

      const [data, totalItems] = await this.settlementsRepository.findAndCount({
        where: query,
        relations: {
          user: true,
          settledBy: true,
          bankDetails: true,
        },
        select: {
          id: true,
          amountAfterDeduction: true,
          status: true,
          transferId: true,
          transferMode: true,
          remarks: true,
          createdAt: true,
          settledBy: {
            fullName: true,
          },
          user: {
            fullName: true,
            bankDetails: true,
          },
          bankDetails: {
            id: true,
            name: true,
            bankName: true,
            accountNumber: true,
            bankIFSC: true,
          },
        },
        take: limit,
        skip: (page - 1) * limit,
        order: {
          [sort]: order,
        },
      });

      const pagination = getPagination({
        limit,
        totalItems,
        page,
      });

      return {
        data,
        pagination,
      };
    } else {
      const whereQuery:
        | FindOptionsWhere<SettlementsEntity>
        | FindOptionsWhere<SettlementsEntity>[] = {};

      // Date Filter
      if (startDate && endDate) {
        whereQuery.createdAt = Between(new Date(startDate), new Date(endDate));
      } else if (startDate) {
        whereQuery.createdAt = MoreThanOrEqual(new Date(startDate));
      } else if (endDate) {
        whereQuery.createdAt = LessThanOrEqual(new Date(endDate));
      }

      if (search) {
        whereQuery.transferId = ILike(`%${search}%`);
        whereQuery.user = {
          id: user.id,
        };
      } else {
        whereQuery.user = {
          id: user.id,
        };
      }

      const [data, totalItems] = await this.settlementsRepository.findAndCount({
        where: whereQuery,
        relations: {
          user: true,
          settledBy: true,
          bankDetails: true,
        },
        select: {
          id: true,
          amountAfterDeduction: true,
          status: true,
          transferId: true,
          transferMode: true,
          remarks: true,
          createdAt: true,
          settledBy: {
            fullName: true,
          },
          user: {
            fullName: true,
            bankDetails: true,
          },
          bankDetails: {
            id: true,
            name: true,
            bankName: true,
            accountNumber: true,
            bankIFSC: true,
          },
        },
        take: limit,
        skip: (page - 1) * limit,
        order: {
          [sort]: order,
        },
      });

      const pagination = getPagination({
        limit,
        totalItems,
        page,
      });

      return {
        data,
        pagination,
      };
    }
  }

  async checkSettlementStatus(settlementId: string, cpId: string) {
    const settlement = await this.settlementsRepository.findOne({
      where: {
        id: settlementId,
        user: {
          channelPartnerId: cpId,
        },
      },
    });

    if (!settlement) {
      throw new NotFoundException(
        new MessageResponseDto("No Settlement Found"),
      );
    }

    return {
      settlementId,
      status: settlement.status,
      amount: settlement.amountAfterDeduction,
    };
  }
}
