import {
  BadRequestException,
  Injectable,
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
import { AxiosService } from "@/shared/axios/axios.service";
import { appConfig } from "@/config/app.config";
import { IExternalPayoutStatusResponseIsmart } from "@/interface/external-api.interface";
import { ISMART_PAY } from "@/constants/external-api.constant";
import { convertExternalPaymentStatusToInternal } from "@/utils/helperFunctions.utils";
import { getIsmartPayPgConfig } from "@/utils/pg-config.utils";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import { todayEndDate, todayStartDate } from "@/utils/date.utils";

const { externalPaymentConfig } = appConfig();

@Injectable()
export class ChannelPartnersService {
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

  async getStats(cpId: string) {}

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
      where: { id: payinId, user: { channelPartnerId: cpId } },
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
        this.settlementsRepository.sum("amount", {
          user: { channelPartnerId: cpId },
          createdAt: Between(new Date(startDate), new Date(endDate)),
        }),
        this.settlementsRepository.count({
          where: {
            user: { channelPartnerId: cpId },
            createdAt: Between(new Date(startDate), new Date(endDate)),
          },
        }),
        this.settlementsRepository.sum("amount", {
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
        this.settlementsRepository.sum("amount", {
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
          amount: true,
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
          amount: true,
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

    if (settlement.status === PAYMENT_STATUS.SUCCESS) {
      return {
        settlementId,
        status: settlement.status,
        amount: settlement.amount,
      };
    }

    const axiosServiceIsmart = new AxiosService(
      ISMART_PAY.BASE_URL,
      getIsmartPayPgConfig({
        clientId: externalPaymentConfig.ismart.clientId,
        clientSecret: externalPaymentConfig.ismart.clientSecret,
      }),
    );

    // call third party api
    const response =
      await axiosServiceIsmart.getRequest<IExternalPayoutStatusResponseIsmart>(
        `${ISMART_PAY.PAYOUT_STATUS}/${settlement.transferId}`,
      );

    if (!response.status) {
      throw new BadRequestException(new MessageResponseDto(response.message));
    }

    const status = convertExternalPaymentStatusToInternal(response.status_code);

    const settlementRaw = this.settlementsRepository.create({
      id: settlement.id,
      status,
      ...(status === PAYMENT_STATUS.SUCCESS && {
        successAt: new Date(),
      }),
      ...(status === PAYMENT_STATUS.FAILED && {
        failureAt: new Date(),
      }),
    });

    await this.settlementsRepository.save(settlementRaw);

    return {
      settlementId,
      status,
      amount: settlement.amount,
    };
  }
}
