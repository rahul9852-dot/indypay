import {
  Between,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from "typeorm";
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import {
  DateDto,
  MessageResponseDto,
  PaginationWithDateDto,
  PaginationWithoutSortAndOrderDto,
} from "@/dtos/common.dto";
import { todayEndDate, todayStartDate } from "@/utils/date.utils";
import { getPagination } from "@/utils/pagination.utils";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { UsersEntity } from "@/entities/user.entity";
import { USERS_ROLE } from "@/enums";
import { FALKPAY } from "@/constants/external-api.constant";
import { getFlakPayPgConfig } from "@/utils/pg-config.utils";
import { AxiosService } from "@/shared/axios/axios.service";
import { appConfig } from "@/config/app.config";
import { IExternalPayoutStatusResponseFlakPay } from "@/interface/external-api.interface";
import { PayoutStatusDto } from "@/modules/payments/dto/create-payout-payment.dto";
import { convertExternalPaymentStatusToInternal } from "@/utils/helperFunctions.utils";

const { externalPaymentConfig } = appConfig();

@Injectable()
export class PayoutService {
  constructor(
    @InjectRepository(PayOutOrdersEntity)
    private readonly payoutRepository: Repository<PayOutOrdersEntity>,
    @InjectRepository(UsersEntity)
    private readonly userRepository: Repository<UsersEntity>,
  ) {}

  async getAllPayoutsGroupedByUser({
    page = 1,
    limit = 10,

    search = "",
  }: PaginationWithoutSortAndOrderDto) {
    const query = this.userRepository
      .createQueryBuilder("user")
      .where("user.fullName ILIKE :search", { search: `%${search}%` })
      .orWhere("user.email ILIKE :search", { search: `%${search}%` })
      .leftJoin("user.payOutOrders", "payout")
      .select([
        "user.id",

        // Total initiated amount
        'COALESCE(SUM(payout.amount), 0) as "initiatedTotalAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :successStatus THEN payout.amount ELSE 0.00 END), 0) as "successTotalAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :failedStatus THEN payout.amount ELSE 0.00 END), 0) as "failedTotalAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :pendingStatus THEN payout.amount ELSE 0.00 END), 0) as "pendingTotalAmount"',

        // Total commission amount
        'COALESCE(SUM(payout.commissionAmount), 0) as "initiatedCommissionAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :successStatus THEN payout.commissionAmount ELSE 0.00 END), 0) as "successCommissionAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :failedStatus THEN payout.commissionAmount ELSE 0.00 END), 0) as "failedCommissionAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :pendingStatus THEN payout.commissionAmount ELSE 0.00 END), 0) as "pendingCommissionAmount"',

        // Total gst amount
        'COALESCE(SUM(payout.gstAmount), 0) as "initiatedGstAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :successStatus THEN payout.gstAmount ELSE 0.00 END), 0) as "successGstAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :failedStatus THEN payout.gstAmount ELSE 0.00 END), 0) as "failedGstAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :pendingStatus THEN payout.gstAmount ELSE 0.00 END), 0) as "pendingGstAmount"',

        // Total Net Payable amount
        'COALESCE(SUM(payout.netPayableAmount), 0) as "initiatedNetPayableAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :successStatus THEN payout.netPayableAmount ELSE 0.00 END), 0) as "successNetPayableAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :failedStatus THEN payout.netPayableAmount ELSE 0.00 END), 0) as "failedNetPayableAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :pendingStatus THEN payout.netPayableAmount ELSE 0.00 END), 0) as "pendingNetPayableAmount"',

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
      limit = 10,
      sort = "id",
      order = "DESC",
      search = "",
      startDate = todayStartDate(),
      endDate = todayEndDate(),
    }: PaginationWithDateDto,
    userId: string,
  ) {
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

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    const query = [];

    if (search) {
      query.push({
        orderId: ILike(`%${search}%`),
        user: {
          id: userId,
        },
      });
      query.push({
        transferId: ILike(`%${search}%`),
        user: {
          id: userId,
        },
      });
    } else {
      query.push({
        ...whereQuery,
        user: {
          id: userId,
        },
      });
    }

    const [collections, totalItems] = await this.payoutRepository.findAndCount({
      where: query,
      relations: {
        user: true,
      },
      select: {
        id: true,
        amount: true,
        status: true,
        transferId: true,
        orderId: true,
        netPayableAmount: true,
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
        data: collections,
        pagination,
      };
    } else {
      const { todayCollections, todaySuccess, todayFailed } =
        await this.calculateStats(userId, {
          startDate,
          endDate,
        });

      return {
        data: collections,
        pagination,
        stats: {
          totalPayouts: +todayCollections,
          totalSuccess: +todaySuccess,
          totalFailed: +todayFailed,
        },
      };
    }
  }

  async calculateStats(
    userId: string,
    { startDate = todayStartDate(), endDate = todayEndDate() }: DateDto,
  ) {
    const todayCollectionsPromise = this.payoutRepository.sum("amount", {
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

    const [todayCollections, todaySuccess, todayFailed] = await Promise.all([
      todayCollectionsPromise,
      todaySuccessPromise,
      todayFailedPromise,
    ]);

    return {
      todayCollections: +todayCollections,
      todaySuccess: +todaySuccess,
      todayFailed: +todayFailed,
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

  async checkPayOutStatusTransactionFlakPay({ orderId }: PayoutStatusDto) {
    const payoutOrder = await this.payoutRepository.findOne({
      where: { orderId },
    });

    if (!payoutOrder) {
      throw new NotFoundException(
        new MessageResponseDto("Payout order not found"),
      );
    }

    if (payoutOrder.status !== PAYMENT_STATUS.PENDING) {
      return {
        orderId: payoutOrder.orderId,
        status: payoutOrder.status,
        transferId: payoutOrder.transferId,
      };
    }

    // call api

    const axiosServiceFlakPay = new AxiosService(
      FALKPAY.BASE_URL,
      getFlakPayPgConfig({
        clientId: externalPaymentConfig.flakPay.clientId,
        clientSecret: externalPaymentConfig.flakPay.clientSecret,
      }),
    );

    const flakPayResponse =
      await axiosServiceFlakPay.postRequest<IExternalPayoutStatusResponseFlakPay>(
        FALKPAY.PAYOUT.STATUS_CHECK,
        {
          orderId,
        },
      );

    if (flakPayResponse.statusCode !== HttpStatus.OK) {
      throw new BadRequestException(
        new MessageResponseDto(flakPayResponse.message),
      );
    }

    // update payout order

    const status = convertExternalPaymentStatusToInternal(
      flakPayResponse.data.status.toUpperCase(),
    );

    await this.payoutRepository.save(
      this.payoutRepository.create({
        ...payoutOrder,
        status,
        transferId: flakPayResponse.data.transferId,
      }),
    );

    return {
      orderId: payoutOrder.orderId,
      status,
      transferId: flakPayResponse.data.transferId,
    };
  }
}
