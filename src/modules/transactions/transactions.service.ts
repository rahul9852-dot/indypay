import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { PAYMENT_STATUS } from "@/enums/payment.enum";

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(TransactionsEntity)
    private readonly transactionsRepository: Repository<TransactionsEntity>,

    @InjectRepository(PayInOrdersEntity)
    private readonly payInOrdersRepository: Repository<PayInOrdersEntity>,
  ) {}

  selectQuery = {
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
      amount: true,
      createdAt: true,
    },
  };

  async getAllTransactionsAdmin() {
    return await this.transactionsRepository.find({
      relations: {
        user: true,
        payInOrder: true,
        payOutOrder: true,
      },
      select: this.selectQuery,
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

  async getAllTransactionMerchant(userId: string) {
    return await this.transactionsRepository.find({
      where: { user: { id: userId } },
      relations: {
        user: true,
        payInOrder: true,
        payOutOrder: true,
      },
      select: this.selectQuery,
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

  async getAllTransactionsOfMerchant(userId: string) {
    return await this.transactionsRepository.find({
      where: { user: { id: userId } },
      relations: {
        user: true,
        payInOrder: true,
        payOutOrder: true,
      },
      select: this.selectQuery,
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
