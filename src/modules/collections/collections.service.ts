import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { UsersEntity } from "@/entities/user.entity";
import { PaginationDto } from "@/dtos/common.dto";
import { getPagination } from "@/utils/pagination.utils";
import { PAYMENT_STATUS } from "@/enums/payment.enum";

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(PayInOrdersEntity)
    private readonly payInOrdersRepository: Repository<PayInOrdersEntity>,
  ) {}

  async getAllCollectionsGroupByUserAdmin({
    limit = 10,
    page = 1,
    sort = "id",
    order = "DESC",
    search = "",
  }: PaginationDto) {
    const collections = await this.payInOrdersRepository
      .createQueryBuilder("payin")
      .leftJoinAndSelect("payin.user", "user")
      .where("user.fullName ILIKE :search", { search: `%${search}%` })
      .select("user.id", "id")
      .addSelect("user.fullName", "fullName")
      .addSelect("SUM(payin.amount)", "initiatedTotalAmount")
      .addSelect(
        "SUM(CASE WHEN payin.status = :successStatus THEN payin.amount ELSE 0.00 END)",
        "successTotalAmount",
      )
      .addSelect(
        "SUM(CASE WHEN payin.status = :failedStatus THEN payin.amount ELSE 0.00 END)",
        "failedTotalAmount",
      )
      .addSelect(
        "SUM(CASE WHEN payin.status = :pendingStatus THEN payin.amount ELSE 0.00 END)",
        "pendingTotalAmount",
      )
      .addSelect("SUM(payin.commissionAmount)", "initiatedCommissionAmount")
      .addSelect(
        "SUM(CASE WHEN payin.status = :successStatus THEN payin.commissionAmount ELSE 0.00 END)",
        "successCommissionAmount",
      )
      .addSelect(
        "SUM(CASE WHEN payin.status = :failedStatus THEN payin.commissionAmount ELSE 0.00 END)",
        "failedCommissionAmount",
      )
      .addSelect(
        "SUM(CASE WHEN payin.status = :pendingStatus THEN payin.commissionAmount ELSE 0.00 END)",
        "pendingCommissionAmount",
      )
      .addSelect("SUM(payin.gstAmount)", "initiatedGstAmount")
      .addSelect(
        "SUM(CASE WHEN payin.status = :successStatus THEN payin.gstAmount ELSE 0.00 END)",
        "successGstAmount",
      )
      .addSelect(
        "SUM(CASE WHEN payin.status = :failedStatus THEN payin.gstAmount ELSE 0.00 END)",
        "failedGstAmount",
      )
      .addSelect(
        "SUM(CASE WHEN payin.status = :pendingStatus THEN payin.gstAmount ELSE 0.00 END)",
        "pendingGstAmount",
      )
      .addSelect("SUM(payin.netPayableAmount)", "initiatedNetPayableAmount")
      .addSelect(
        "SUM(CASE WHEN payin.status = :successStatus THEN payin.netPayableAmount ELSE 0.00 END)",
        "successNetPayableAmount",
      )
      .addSelect(
        "SUM(CASE WHEN payin.status = :failedStatus THEN payin.netPayableAmount ELSE 0.00 END)",
        "failedNetPayableAmount",
      )
      .addSelect(
        "SUM(CASE WHEN payin.status = :pendingStatus THEN payin.netPayableAmount ELSE 0.00 END)",
        "pendingNetPayableAmount",
      )
      .addSelect("COUNT(payin.id)", "initiatedTotalCount")
      .addSelect(
        "COUNT(CASE WHEN payin.status = :successStatus THEN 1 ELSE NULL END)",
        "successCount",
      )
      .addSelect(
        "COUNT(CASE WHEN payin.status = :failedStatus THEN 1 ELSE NULL END)",
        "failedCount",
      )
      .addSelect(
        "COUNT(CASE WHEN payin.status = :pendingStatus THEN 1 ELSE NULL END)",
        "pendingCount",
      )
      .groupBy("user.id")
      .addGroupBy("user.fullName")
      .setParameter("successStatus", PAYMENT_STATUS.SUCCESS)
      .setParameter("failedStatus", PAYMENT_STATUS.FAILED)
      .setParameter("pendingStatus", PAYMENT_STATUS.PENDING)
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy(sort, order)
      .getRawMany();

    const pagination = getPagination({
      page,
      limit,
      totalItems: collections.length,
    });

    return {
      data: collections,
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
    }: PaginationDto,
  ) {
    const [collections] = await this.payInOrdersRepository.findAndCount({
      where: { orderId: ILike(`%${search}%`), user: { id: userId } },
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
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      order: { [sort]: order },
    });

    const pagination = getPagination({
      page,
      limit,
      totalItems: collections.length,
    });

    return {
      data: collections,
      pagination,
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
        netPayableAmount: true,
        settlementStatus: true,
        user: {
          id: true,
          fullName: true,
          email: true,
          mobile: true,
          accountStatus: true,
        },
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
    }: PaginationDto,
  ) {
    const [collections, totalItems] =
      await this.payInOrdersRepository.findAndCount({
        where: { orderId: ILike(`%${search}%`), user: { id: user.id } },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          txnRefId: true,
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
