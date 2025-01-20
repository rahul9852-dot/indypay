import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { WalletEntity } from "@/entities/wallet.entity";
import { UsersEntity } from "@/entities/user.entity";
import { WalletTopupEntity } from "@/entities/wallet-topup.entity";
import { MessageResponseDto, PaginationDto } from "@/dtos/common.dto";
import { getPagination } from "@/utils/pagination.utils";
import { SettlementsEntity } from "@/entities/settlements.entity";
import { PAYMENT_STATUS } from "@/enums/payment.enum";

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
    @InjectRepository(WalletTopupEntity)
    private readonly walletTopupRepository: Repository<WalletTopupEntity>,
    @InjectRepository(SettlementsEntity)
    private readonly settlementsRepository: Repository<SettlementsEntity>,
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
  ) {}

  async getWallet(userId: string) {
    return this.walletRepository.findOne({
      where: { user: { id: userId } },
      select: {
        id: true,
        settledAmount: true,
        netPayableAmount: true,
        availablePayoutBalance: true,
        user: {
          id: true,
          fullName: true,
          email: true,
          mobile: true,
          accountStatus: true,
        },
      },
      relations: {
        user: true,
      },
    });
  }

  async getTopupTransactionsAdmin({
    limit = 10,
    page = 1,
    sort = "id",
    order = "DESC",
    search = "",
  }: PaginationDto) {
    const [transactions, totalItems] =
      await this.walletTopupRepository.findAndCount({
        where: [
          {
            ...(search && { user: { fullName: ILike(`%${search}%`) } }),
          },
        ],
        select: {
          id: true,
          amount: true,
          createdAt: true,
          user: {
            id: true,
            fullName: true,
            email: true,
            mobile: true,
          },
          topupBy: {
            id: true,
            fullName: true,
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        order: {
          [sort]: order,
        },
        relations: {
          user: true,
          topupBy: true,
        },
      });

    const pagination = getPagination({
      totalItems,
      page,
      limit,
    });

    return {
      transactions,
      pagination,
    };
  }

  async getTopupTransactions(
    userId: string,
    {
      limit = 10,
      page = 1,
      sort = "id",
      order = "DESC",
      search = "",
    }: PaginationDto,
  ) {
    const [transactions, totalItems] =
      await this.walletTopupRepository.findAndCount({
        where: [
          { user: { id: userId } },
          {
            user: {
              id: userId,
            },
            ...(search && { id: ILike(`%${search}%`) }),
          },
        ],
        select: {
          id: true,
          amount: true,
          createdAt: true,
          user: {
            id: true,
            fullName: true,
            email: true,
            mobile: true,
          },
          topupBy: {
            id: true,
            fullName: true,
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        order: {
          [sort]: order,
        },
        relations: {
          user: true,
          topupBy: true,
        },
      });

    const pagination = getPagination({
      totalItems,
      page,
      limit,
    });

    return {
      transactions,
      pagination,
    };
  }

  async topUpWallet(
    merchantUserId: string,
    adminUser: UsersEntity,
    amount: number,
  ) {
    const wallet = await this.walletRepository.findOne({
      where: { user: { id: merchantUserId } },
      relations: {
        user: true,
      },
    });

    if (!wallet) {
      throw new NotFoundException(new MessageResponseDto("Wallet not found"));
    }

    if (+wallet.netPayableAmount < amount) {
      throw new BadRequestException(
        new MessageResponseDto("Insufficient wallet balance"),
      );
    }

    const merchantUser = await this.usersRepository.findOne({
      where: { id: merchantUserId },
    });

    // record a topup transaction
    const topUp = this.walletTopupRepository.create({
      user: merchantUser,
      amount,
      topupBy: adminUser,
    });

    await this.walletTopupRepository.save(topUp);

    const settlement = this.settlementsRepository.create({
      amount: +amount,
      user: merchantUser,
      status: PAYMENT_STATUS.SUCCESS,
      successAt: new Date(),
      settledBy: adminUser,
      remarks: "Wallet topup",
    });

    await this.settlementsRepository.save(settlement);

    // update wallet balance
    const savedWallet = await this.walletRepository.save(
      this.walletRepository.create({
        id: wallet.id,
        user: wallet.user,
        settledAmount: +wallet.settledAmount + amount,
        netPayableAmount: +wallet.netPayableAmount - amount,
        availablePayoutBalance: +wallet.availablePayoutBalance + amount,
      }),
    );

    return {
      userId: merchantUserId,
      availablePayoutBalance: savedWallet.availablePayoutBalance,
      message: "Topup successful",
    };
  }
}
