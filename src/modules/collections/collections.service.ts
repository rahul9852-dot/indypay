import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Between,
  Brackets,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from "typeorm";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { UsersEntity } from "@/entities/user.entity";
import {
  PaginationWithDateAndStatusDto,
  PaginationWithDateDto,
} from "@/dtos/common.dto";
import { getPagination } from "@/utils/pagination.utils";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { todayEndDate, todayStartDate } from "@/utils/date.utils";
import { ACCOUNT_STATUS, ONBOARDING_STATUS, USERS_ROLE } from "@/enums";
import { convertExternalPaymentStatusToInternal } from "@/utils/helperFunctions.utils";

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(PayInOrdersEntity)
    private readonly payInOrdersRepository: Repository<PayInOrdersEntity>,
    @InjectRepository(UsersEntity)
    private readonly userRepository: Repository<UsersEntity>,
  ) {}

  async getAllCollectionsGroupByUserAdmin({
    limit = 10,
    page = 1,
    search = "",
    startDate = todayStartDate(),
    endDate = todayEndDate(),
  }: PaginationWithDateDto) {
    const query = this.userRepository
      .createQueryBuilder("user")
      .where(
        new Brackets((qb) => {
          qb.where("user.fullName ILIKE :search", {
            search: `%${search}%`,
          }).orWhere("user.email ILIKE :search", { search: `%${search}%` });
        }),
      )
      .andWhere("user.role = :role", { role: USERS_ROLE.MERCHANT })
      .andWhere("user.onboardingStatus = :onboardingStatus", {
        onboardingStatus: ONBOARDING_STATUS.KYC_VERIFIED,
      })
      .andWhere("user.accountStatus NOT IN (:...statuses)", {
        statuses: [
          ACCOUNT_STATUS.INTERNAL_USER,
          ACCOUNT_STATUS.TEST_DELETED,
          ACCOUNT_STATUS.DELETED,
        ],
      })
      .leftJoin(
        "user.payInOrders",
        "payin",
        // Add the date condition in the join itself
        "payin.createdAt >= :today AND payin.createdAt < :tomorrow",
      )
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
      .setParameter("pendingStatus", PAYMENT_STATUS.PENDING)
      .setParameter("today", new Date(startDate))
      .setParameter("tomorrow", new Date(endDate));

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

  async getAllCollectionsByUserIdAdmin(
    userId: string,
    {
      limit = 10,
      page = 1,
      sort = "id",
      order = "DESC",
      search = "",
      status,
      startDate = todayStartDate(),
      endDate = todayEndDate(),
    }: PaginationWithDateAndStatusDto,
  ) {
    const whereQuery: FindOptionsWhere<PayInOrdersEntity> = {};

    const internalStatus = status
      ? convertExternalPaymentStatusToInternal(status.toUpperCase())
      : undefined;

    if (startDate && endDate) {
      whereQuery.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      whereQuery.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      whereQuery.createdAt = LessThanOrEqual(new Date(endDate));
    }
    whereQuery.user = { id: userId };
    if (internalStatus) {
      whereQuery.status = internalStatus;
    }

    const query = [];

    if (search) {
      query.push({
        ...whereQuery,
        orderId: ILike(`%${search}%`),
      });
      query.push({
        ...whereQuery,
        txnRefId: ILike(`%${search}%`),
      });
    } else {
      query.push(whereQuery);
    }

    const [collections, totalItems] =
      await this.payInOrdersRepository.findAndCount({
        where: query,
        relations: {
          user: true,
        },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          txnRefId: true,
          utr: true,
          orderId: true,
          netPayableAmount: true,
          settlementStatus: true,
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
      page,
      limit,
      totalItems,
    });

    const todayCollectionsPromise = this.payInOrdersRepository.sum("amount", {
      createdAt: Between(new Date(startDate), new Date(endDate)),
      user: { id: userId },
    });

    const todaySuccessPromise = this.payInOrdersRepository.sum("amount", {
      createdAt: Between(new Date(startDate), new Date(endDate)),
      status: PAYMENT_STATUS.SUCCESS,
      user: { id: userId },
    });

    const todayFailedPromise = this.payInOrdersRepository.sum("amount", {
      createdAt: Between(new Date(startDate), new Date(endDate)),
      status: PAYMENT_STATUS.FAILED,
      user: { id: userId },
    });

    const [todayCollections, todaySuccess, todayFailed] = await Promise.all([
      todayCollectionsPromise,
      todaySuccessPromise,
      todayFailedPromise,
    ]);

    return {
      data: collections,
      pagination,
      stats: {
        todayCollections: +todayCollections,
        todaySuccess: +todaySuccess,
        todayFailed: +todayFailed,
      },
    };
  }

  async getCollectionsByPayinIdAdmin(payinId: string) {
    return this.payInOrdersRepository.findOne({
      where: { id: payinId },
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
        utr: true,
        netPayableAmount: true,
        settlementStatus: true,
        user: {
          fullName: true,
          email: true,
          mobile: true,
          accountStatus: true,
        },
      },
    });
  }

  async getCollectionsByOrderIdAdmin(orderId: string) {
    return this.payInOrdersRepository.findOne({
      where: { orderId },
      select: {
        id: true,
        amount: true,
        status: true,
        txnRefId: true,
        orderId: true,
        utr: true,
        isMisspelled: true,
        createdAt: true,
      },
    });
  }

  async getAllCollections(
    user: UsersEntity,
    {
      limit = 10,
      page = 1,
      sort = "id",
      order = "DESC",
      search = "",
      startDate,
      endDate,
    }: PaginationWithDateDto,
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

    if (search) {
      query.push({
        orderId: ILike(`%${search}%`),
        user: { id: user.id },
      });
      query.push({
        txnRefId: ILike(`%${search}%`),
        user: { id: user.id },
      });
    } else {
      query.push({
        ...whereQuery,
        user: { id: user.id },
      });
    }

    const [collections, totalItems] =
      await this.payInOrdersRepository.findAndCount({
        where: query,
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          txnRefId: true,
          utr: true,
          orderId: true,
          netPayableAmount: true,
          settlementStatus: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        order: { [sort]: order },
      });

    const pagination = getPagination({
      totalItems,
      limit,
      page,
    });

    return { data: collections, pagination };
  }

  async getCollectionById(user: UsersEntity, payinId: string) {
    return await this.payInOrdersRepository.findOne({
      where: { id: payinId, user: { id: user.id } },
      relations: {
        user: true,
      },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        txnRefId: true,
        utr: true,
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
}
