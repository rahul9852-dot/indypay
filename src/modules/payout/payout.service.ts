import {
  Between,
  Brackets,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from "typeorm";
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import {
  DateDto,
  MessageResponseDto,
  PaginationWithDateAndStatusDto,
  PaginationWithDateDto,
  PaginationWithoutSortAndOrderDto,
} from "@/dtos/common.dto";
import { todayEndDate, todayStartDate } from "@/utils/date.utils";
import { getPagination } from "@/utils/pagination.utils";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { UsersEntity } from "@/entities/user.entity";
import { ACCOUNT_STATUS, ONBOARDING_STATUS, USERS_ROLE } from "@/enums";
import { convertExternalPaymentStatusToInternal } from "@/utils/helperFunctions.utils";

@Injectable()
export class PayoutService {
  constructor(
    @InjectRepository(PayOutOrdersEntity)
    private readonly payoutRepository: Repository<PayOutOrdersEntity>,
    @InjectRepository(UsersEntity)
    private readonly userRepository: Repository<UsersEntity>,
  ) {}

  async getAllPayoutsGroupedByUser(
    {
      page = 1,
      limit = 10,

      search = "",
    }: PaginationWithoutSortAndOrderDto,
    cpId?: string,
  ) {
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
      });

    if (cpId) {
      query.andWhere("user.channelPartnerId = :cpId", { cpId });
    }

    query
      .leftJoin("user.payOutOrders", "payout")
      .select([
        "user.id",

        // Total initiated amount
        'COALESCE(SUM(payout.amount), 0) as "initiatedTotalAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :successStatus THEN payout.amount ELSE 0.00 END), 0) as "successTotalAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :failedStatus THEN payout.amount ELSE 0.00 END), 0) as "failedTotalAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :pendingStatus THEN payout.amount ELSE 0.00 END), 0) as "pendingTotalAmount"',

        // Total Net Payable amount
        'COALESCE(SUM(payout.amountBeforeDeduction), 0) as "initiatedNetPayableAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :successStatus THEN payout.amountBeforeDeduction ELSE 0.00 END), 0) as "successNetPayableAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :failedStatus THEN payout.amountBeforeDeduction ELSE 0.00 END), 0) as "failedNetPayableAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :pendingStatus THEN payout.amountBeforeDeduction ELSE 0.00 END), 0) as "pendingNetPayableAmount"',

        // count: total initiated payout
        'COUNT(payout.id) as "initiatedTotalCount"',
        'COUNT(CASE WHEN payout.status = :successStatus THEN payout.id ELSE NULL END) as "successCount"',
        'COUNT(CASE WHEN payout.status = :failedStatus THEN payout.id ELSE NULL END) as "failedCount"',
        'COUNT(CASE WHEN payout.status = :pendingStatus THEN payout.id ELSE NULL END) as "pendingCount"',
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

  async getAllPayoutsAdmin({
    page = 1,
    limit = 10,
    sort = "id",
    order = "DESC",
    search = "",
    startDate = todayStartDate(),
    endDate = todayEndDate(),
  }: PaginationWithDateDto) {
    const whereQuery:
      | FindOptionsWhere<PayOutOrdersEntity>
      | FindOptionsWhere<PayOutOrdersEntity>[] = {};

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
        orderId: ILike(`%${search}%`),
      });
      query.push({
        user: {
          fullName: ILike(`%${search}%`),
        },
      });
      query.push({
        user: {
          email: ILike(`%${search}%`),
        },
      });
    }

    const [data, totalItems] = await this.payoutRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        [sort]: order,
      },
      where: query,
      relations: {
        user: true,
      },
      select: {
        user: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        orderId: true,
        amount: true,
        status: true,
        createdAt: true,
        transferId: true,
        transferMode: true,
      },
    });

    const pagination = getPagination({ totalItems, page, limit });

    return {
      data,
      pagination,
    };
  }

  async getAllPayoutsMerchant(
    {
      page = 1,
      limit = 50,
      sort = "id",
      order = "DESC",
      search = "",
      startDate = todayStartDate(),
      endDate = todayEndDate(),
      status,
    }: PaginationWithDateAndStatusDto,
    userId: string,
    cpId?: string,
  ) {
    const whereQuery:
      | FindOptionsWhere<PayOutOrdersEntity>
      | FindOptionsWhere<PayOutOrdersEntity>[] = {};

    const internalStatus = status
      ? convertExternalPaymentStatusToInternal(status.toUpperCase())
      : undefined;

    // Date Filter
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

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
      relations: { channelPartner: true },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    if (
      cpId &&
      ![USERS_ROLE.ADMIN, USERS_ROLE.OWNER].includes(user.role) &&
      user.channelPartnerId !== cpId
    ) {
      throw new ForbiddenException("Unauthorized access to payouts");
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

    const [payouts, totalItems] = await this.payoutRepository.findAndCount({
      where: query,
      relations: {
        user: true,
      },
      select: {
        id: true,
        amount: true,
        amountBeforeDeduction: true,
        commissionInPercentage: true,
        gstInPercentage: true,
        status: true,
        transferId: true,
        orderId: true,
        payoutId: true,
        transferMode: true,
        utr: true,
        batchId: true,
        createdAt: true,
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

    if ([USERS_ROLE.ADMIN, USERS_ROLE.OWNER].includes(user.role)) {
      return {
        data: payouts,
        pagination,
      };
    } else {
      const {
        todayPayouts,
        todaySuccess,
        todayFailed,
        todayPayoutsWithCharges,
        todaySuccessWithCharges,
        todayFailedWithCharges,
      } = await this.calculateStats(userId, {
        startDate,
        endDate,
      });

      return {
        data: payouts,
        pagination,
        stats: {
          totalPayouts: +todayPayouts,
          totalPayoutsWithCharges: +todayPayoutsWithCharges,
          totalSuccess: +todaySuccess,
          totalSuccessWithCharges: +todaySuccessWithCharges,
          totalFailed: +todayFailed,
          totalFailedWithCharges: +todayFailedWithCharges,
        },
      };
    }
  }

  async calculateStats(
    userId: string,
    { startDate = todayStartDate(), endDate = todayEndDate() }: DateDto,
  ) {
    const todayPayoutsPromise = this.payoutRepository.sum("amount", {
      createdAt: Between(new Date(startDate), new Date(endDate)),
      user: { id: userId },
    });

    const todaySuccessPromise = this.payoutRepository.sum("amount", {
      createdAt: Between(new Date(startDate), new Date(endDate)),
      status: PAYMENT_STATUS.SUCCESS,
      user: { id: userId },
    });

    const todayFailedPromise = this.payoutRepository.sum("amount", {
      createdAt: Between(new Date(startDate), new Date(endDate)),
      status: PAYMENT_STATUS.FAILED,
      user: { id: userId },
    });

    const todayPayoutsPromiseWithCharges = this.payoutRepository.sum(
      "amountBeforeDeduction",
      {
        createdAt: Between(new Date(startDate), new Date(endDate)),
        user: { id: userId },
      },
    );

    const todaySuccessPromiseWithCharges = this.payoutRepository.sum(
      "amountBeforeDeduction",
      {
        createdAt: Between(new Date(startDate), new Date(endDate)),
        status: PAYMENT_STATUS.SUCCESS,
        user: { id: userId },
      },
    );

    const todayFailedPromiseWithCharges = this.payoutRepository.sum(
      "amountBeforeDeduction",
      {
        createdAt: Between(new Date(startDate), new Date(endDate)),
        status: PAYMENT_STATUS.FAILED,
        user: { id: userId },
      },
    );

    const [
      todayPayouts,
      todaySuccess,
      todayFailed,
      todayPayoutsWithCharges,
      todaySuccessWithCharges,
      todayFailedWithCharges,
    ] = await Promise.all([
      todayPayoutsPromise,
      todaySuccessPromise,
      todayFailedPromise,
      todayPayoutsPromiseWithCharges,
      todaySuccessPromiseWithCharges,
      todayFailedPromiseWithCharges,
    ]);

    return {
      todayPayouts: +todayPayouts,
      todaySuccess: +todaySuccess,
      todayFailed: +todayFailed,
      todayPayoutsWithCharges: +todayPayoutsWithCharges,
      todaySuccessWithCharges: +todaySuccessWithCharges,
      todayFailedWithCharges: +todayFailedWithCharges,
    };
  }

  async getPayoutById(payoutId: string) {
    const payout = await this.payoutRepository.findOne({
      where: { id: payoutId },
      relations: {
        user: true,
      },
      select: {
        user: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        id: true,
        orderId: true,
        amount: true,
        status: true,
        transferId: true,
        transferMode: true,
        batchId: true,
        createdAt: true,
      },
    });

    if (!payout) {
      throw new NotFoundException(new MessageResponseDto("Payout not found"));
    }

    return payout;
  }

  async getPayoutByOrderId(orderId: string) {
    const payout = await this.payoutRepository.findOne({
      where: { orderId },
      relations: {
        user: true,
      },
      select: {
        id: true,
        orderId: true,
        amount: true,
        status: true,
        transferId: true,
        transferMode: true,
        batchId: true,
        bankName: true,
        bankAccountNumber: true,
        bankIfsc: true,
        successAt: true,
        createdAt: true,
        name: true,
        payoutId: true,
        purpose: true,
        remarks: true,
        utr: true,
        user: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    });

    if (!payout) {
      throw new NotFoundException(new MessageResponseDto("Payout not found"));
    }

    return payout;
  }
}
