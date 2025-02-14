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
import { ACCOUNT_STATUS, ONBOARDING_STATUS, USERS_ROLE } from "@/enums";

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

  async getWalletList({
    limit = 10,
    page = 1,
    sort = "id",
    order = "DESC",
  }: PaginationDto) {
    const [wallets, totalItems] = await this.usersRepository.findAndCount({
      where: {
        role: USERS_ROLE.MERCHANT,
        accountStatus: ACCOUNT_STATUS.ACTIVE,
        onboardingStatus: ONBOARDING_STATUS.KYC_VERIFIED,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobile: true,
        wallet: {
          id: true,
        },
      },
      relations: {
        wallet: true,
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

    return {
      data: wallets,
      pagination,
    };
  }

  async getWallet(userId: string) {
    return this.walletRepository.findOne({
      where: { user: { id: userId } },
      select: {
        id: true,
        totalTopUp: true,
        availablePayoutBalance: true,
        totalPayout: true,
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

  async getWalletListByUserId(
    userId: string,
    {
      limit = 10,
      page = 1,
      sort = "id",
      order = "DESC",
      search = "",
    }: PaginationDto,
  ) {
    const walletQueryBuilder = this.walletRepository
      .createQueryBuilder("wallet")
      .leftJoin("wallet.user", "user")
      .where("user.id = :userId", { userId })
      .select([
        "wallet.totalTopUp",
        "wallet.availablePayoutBalance",
        "wallet.totalPayout",
      ]);

    const wallet = await walletQueryBuilder.getOne();

    if (!wallet) {
      throw new NotFoundException(new MessageResponseDto("Wallet not found"));
    }

    const topupQueryBuilder = this.walletTopupRepository
      .createQueryBuilder("topup")
      .leftJoinAndSelect("topup.user", "user")
      .leftJoinAndSelect("topup.topupBy", "topupBy")
      .where("user.id = :userId", { userId });

    if (search) {
      topupQueryBuilder.andWhere("user.fullName ILIKE :search", {
        search: `%${search}%`,
      });
    }

    const [transactions, totalItems] = await topupQueryBuilder
      .select([
        "topup.id",
        "topup.amount",
        "topup.createdAt",
        "user.id",
        "user.fullName",
        "user.email",
        "user.mobile",
        "topupBy.id",
        "topupBy.fullName",
      ])
      .orderBy(`topup.${sort}`, order as "ASC" | "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const pagination = getPagination({
      totalItems,
      page,
      limit,
    });

    return {
      data: transactions,
      pagination,
      stats: {
        totalTopup: wallet.totalTopUp || 0,
        availablePayout: wallet.availablePayoutBalance || 0,
        totalPayout: wallet.totalPayout || 0,
      },
    };
  }

  async getWalletListByMerchant(
    {
      page = 1,
      limit = 10,
      sort = "id",
      order = "DESC",
      search = "",
    }: PaginationDto,
    merchantId: string,
  ) {
    const walletQueryBuilder = this.walletRepository
      .createQueryBuilder("wallet")
      .leftJoin("wallet.user", "user")
      .where("user.id = :merchantId", { merchantId })
      .select([
        "wallet.totalTopUp",
        "wallet.availablePayoutBalance",
        "wallet.totalPayout",
      ]);

    const wallet = await walletQueryBuilder.getOne();

    if (!wallet) {
      throw new NotFoundException(new MessageResponseDto("Wallet not found"));
    }

    const topupQueryBuilder = this.walletTopupRepository
      .createQueryBuilder("topup")
      .leftJoinAndSelect("topup.user", "user")
      .leftJoinAndSelect("topup.topupBy", "topupBy")
      .where("user.id = :merchantId", { merchantId });

    if (search) {
      topupQueryBuilder.andWhere("user.fullName ILIKE :search", {
        search: `%${search}%`,
      });
    }

    const [transactions, totalItems] = await topupQueryBuilder
      .select([
        "topup.id",
        "topup.amount",
        "topup.createdAt",
        "user.id",
        "user.fullName",
        "user.email",
        "user.mobile",
        "topupBy.id",
        "topupBy.fullName",
      ])
      .orderBy(`topup.${sort}`, order as "ASC" | "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const pagination = getPagination({
      totalItems,
      page,
      limit,
    });

    return {
      data: transactions,
      pagination,
      stats: {
        totalTopup: wallet.totalTopUp || 0,
        availablePayout: wallet.availablePayoutBalance || 0,
        totalPayout: wallet.totalPayout || 0,
      },
    };
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

    // const settlement = this.settlementsRepository.create({
    //   amount: +amount,
    //   user: merchantUser,
    //   status: PAYMENT_STATUS.SUCCESS,
    //   successAt: new Date(),
    //   settledBy: adminUser,
    //   remarks: "Wallet topup",
    // });

    // await this.settlementsRepository.save(settlement);

    // update wallet balance
    const savedWallet = await this.walletRepository.save(
      this.walletRepository.create({
        id: wallet.id,
        user: wallet.user,
        totalTopUp: +wallet.totalTopUp + amount,
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
