import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, ILike, Repository } from "typeorm";
import { WalletEntity } from "@/entities/wallet.entity";
import { UsersEntity } from "@/entities/user.entity";
import { WalletTopupEntity } from "@/entities/wallet-topup.entity";
import { MessageResponseDto, PaginationDto } from "@/dtos/common.dto";
import { getPagination } from "@/utils/pagination.utils";
import { ACCOUNT_STATUS, ONBOARDING_STATUS, USERS_ROLE } from "@/enums";
import {
  getCommissions,
  // getPayoutCommissions,
} from "@/utils/commissions.utils";
import { todayEndDate, todayStartDate } from "@/utils/date.utils";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";

@Injectable()
export class WalletsService {
  private readonly logger = new CustomLogger(WalletsService.name);
  constructor(
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
    @InjectRepository(WalletTopupEntity)
    private readonly walletTopupRepository: Repository<WalletTopupEntity>,
    @InjectRepository(PayOutOrdersEntity)
    private readonly payoutRepository: Repository<PayOutOrdersEntity>,
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
        totalCollections: true,
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
        "wallet.availablePayoutBalance",
        "wallet.totalCollections",
        "wallet.availablePayoutBalance",
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
      topupQueryBuilder.andWhere(
        `(CAST(topup.id AS TEXT) ILIKE :search OR 
          topupBy.fullName ILIKE :search OR 
          CAST(topup.topUpAmount AS TEXT) ILIKE :search OR 
          CAST(topup.collectionAmount AS TEXT) ILIKE :search)`,
        {
          search: `%${search}%`,
        },
      );
    }

    const topupAmountPromise = this.walletTopupRepository.sum("topUpAmount", {
      user: { id: userId },
      createdAt: Between(new Date(todayStartDate()), new Date(todayEndDate())),
    });

    const totalPayoutPromise = this.payoutRepository.sum("amount", {
      user: { id: userId },
      status: PAYMENT_STATUS.SUCCESS,
      createdAt: Between(new Date(todayStartDate()), new Date(todayEndDate())),
    });

    const [[transactions, totalItems], topupAmount, totalPayout] =
      await Promise.all([
        topupQueryBuilder
          .select([
            "topup.id",
            "topup.collectionAmount",
            "topup.payInCharge",
            "topup.amountAfterPayinDeduction",
            "topup.payOutCharge",
            "topup.topUpAmount",
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
          .getManyAndCount(),
        topupAmountPromise,
        totalPayoutPromise,
      ]);

    const pagination = getPagination({
      totalItems,
      page,
      limit,
    });

    return {
      data: transactions,
      pagination,
      stats: {
        totalTopup: topupAmount || 0,
        availablePayoutBalance: wallet.availablePayoutBalance || 0,
        totalPayout: totalPayout || 0,
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
      .select(["wallet.totalCollections", "wallet.availablePayoutBalance"]);

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

    const topupAmountPromise = this.walletTopupRepository.sum("topUpAmount", {
      user: { id: merchantId },
      createdAt: Between(new Date(todayStartDate()), new Date(todayEndDate())),
    });

    const totalPayoutPromise = this.payoutRepository.sum("amount", {
      user: { id: merchantId },
      createdAt: Between(new Date(todayStartDate()), new Date(todayEndDate())),
    });

    const [[transactions, totalItems], topupAmount, totalPayout] =
      await Promise.all([
        topupQueryBuilder
          .select([
            "topup.id",
            "topup.collectionAmount",
            "topup.payInCharge",
            "topup.amountAfterPayinDeduction",
            "topup.payOutCharge",
            "topup.topUpAmount",
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
          .getManyAndCount(),
        topupAmountPromise,
        totalPayoutPromise,
      ]);

    const pagination = getPagination({
      totalItems,
      page,
      limit,
    });

    return {
      data: transactions,
      pagination,
      stats: {
        totalTopup: topupAmount || 0,
        availablePayoutBalance: wallet.availablePayoutBalance || 0,
        totalPayout: totalPayout || 0,
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
          collectionAmount: true,
          payInCharge: true,
          amountAfterPayinDeduction: true,
          payOutCharge: true,
          topUpAmount: true,
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
          collectionAmount: true,
          payInCharge: true,
          amountAfterPayinDeduction: true,
          topUpAmount: true,
          payOutCharge: true,
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
    collectionAmount: number,
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

    if (+wallet.totalCollections < +collectionAmount) {
      throw new BadRequestException(
        new MessageResponseDto(
          `Insufficient Total Collections balance: ${wallet.totalCollections}`,
        ),
      );
    }

    const merchantUser = await this.usersRepository.findOne({
      where: { id: merchantUserId },
    });

    const {
      netPayableAmount: collectionsAfterDeduction,
      totalServiceChange: payinCharge,
    } = getCommissions({
      amount: collectionAmount,
      commissionInPercentage: merchantUser.commissionInPercentagePayin,
      gstInPercentage: merchantUser.gstInPercentagePayin,
    });

    // const {
    //   totalServiceChange: payoutCharge,
    //   netPayableAmount: netPayableAmountPayout,
    // } = getPayoutCommissions({
    //   amount: collectionsAfterDeduction,
    //   commissionInPercentage: merchantUser.commissionInPercentagePayout,
    //   gstInPercentage: merchantUser.gstInPercentagePayout,
    // });

    this.logger.info(
      `TOPUP - Topup wallet - Net payable amount payout: ${LoggerPlaceHolder.Json}`,
      {
        // netPayableAmountPayout,
        // payoutCharge,
        collectionsAfterDeduction,
        payinCharge,
      },
    );

    // record a topup transaction
    const topUp = this.walletTopupRepository.create({
      user: merchantUser,
      collectionAmount,
      payInCharge: payinCharge,
      amountAfterPayinDeduction: collectionsAfterDeduction,
      // payOutCharge: payoutCharge,
      topUpAmount: collectionsAfterDeduction,
      topupBy: adminUser,
    });

    await this.walletTopupRepository.save(topUp);

    // update wallet balance
    const savedWallet = await this.walletRepository.save(
      this.walletRepository.create({
        id: wallet.id,
        user: wallet.user,
        totalCollections: +wallet.totalCollections - collectionAmount,
        availablePayoutBalance:
          +wallet.availablePayoutBalance + collectionsAfterDeduction,
        // availablePayoutBalance:
        //   +wallet.availablePayoutBalance + netPayableAmountPayout,
      }),
    );

    return {
      userId: merchantUserId,
      availablePayoutBalance: savedWallet.availablePayoutBalance,
      message: "Topup successful",
    };
  }
}
