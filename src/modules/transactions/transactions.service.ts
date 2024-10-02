import { Injectable, InternalServerErrorException } from "@nestjs/common";
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
import { DownloadCsvDto } from "./download-csv.dto";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { PAYMENT_STATUS, PAYMENT_TYPE } from "@/enums/payment.enum";
import { getCsv } from "@/utils/csv.utils";
import { UsersEntity } from "@/entities/user.entity";
import { PaginationDto } from "@/dtos/common.dto";

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(TransactionsEntity)
    private readonly transactionsRepository: Repository<TransactionsEntity>,

    @InjectRepository(PayInOrdersEntity)
    private readonly payInOrdersRepository: Repository<PayInOrdersEntity>,
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
      commissionAmount: true,
      gstAmount: true,
      netPayableAmount: true,
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
    return await this.transactionsRepository.find({
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

  async getStatsForAdmin() {
    const totalAmount = await this.payInOrdersRepository.sum("amount", {});
    const totalCount = await this.payInOrdersRepository.count({});

    const successAmount = await this.payInOrdersRepository.sum("amount", {
      status: PAYMENT_STATUS.SUCCESS,
    });
    const successCount = await this.payInOrdersRepository.count({
      where: { status: PAYMENT_STATUS.SUCCESS },
    });

    const failedAmount = await this.payInOrdersRepository.sum("amount", {
      status: PAYMENT_STATUS.FAILED,
    });
    const failedCount = await this.payInOrdersRepository.count({
      where: { status: PAYMENT_STATUS.FAILED },
    });

    return {
      payin: {
        totalAmount,
        totalCount,
        successAmount,
        successCount,
        failedAmount,
        failedCount,
      },
      payout: {},
    };
  }

  async getStatsForMerchant(userId: string) {
    const totalAmount = await this.payInOrdersRepository.sum("amount", {
      user: { id: userId },
    });
    const totalCount = await this.payInOrdersRepository.count({
      where: { user: { id: userId } },
    });

    const successAmount = await this.payInOrdersRepository.sum("amount", {
      user: { id: userId },
      status: PAYMENT_STATUS.SUCCESS,
    });
    const successCount = await this.payInOrdersRepository.count({
      where: { user: { id: userId }, status: PAYMENT_STATUS.SUCCESS },
    });

    const failedAmount = await this.payInOrdersRepository.sum("amount", {
      user: { id: userId },
      status: PAYMENT_STATUS.FAILED,
    });
    const failedCount = await this.payInOrdersRepository.count({
      where: { user: { id: userId }, status: PAYMENT_STATUS.FAILED },
    });

    return {
      payin: {
        totalAmount,
        totalCount,
        successAmount,
        successCount,
        failedAmount,
        failedCount,
      },
      payout: {},
    };
  }
}
