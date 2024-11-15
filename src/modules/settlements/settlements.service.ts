import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  DataSource,
  ILike,
  Repository,
  MoreThanOrEqual,
  LessThanOrEqual,
  Between,
} from "typeorm";
import { InitiateSettlementAdminDto } from "./dto/initate-settlement-admin.dto";
import { GetSettlementListDto } from "./dto/get-settlement-list.dto";
import {
  MessageResponseDto,
  PaginationWithDateDto,
  PaginationWithoutSortAndOrderDto,
} from "@/dtos/common.dto";
import { UsersEntity } from "@/entities/user.entity";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";
import { AxiosService } from "@/shared/axios/axios.service";
import { appConfig } from "@/config/app.config";
import {
  IExternalPayoutResponse,
  IExternalPayoutRequest,
} from "@/interface/external-api.interface";
import { SettlementsEntity } from "@/entities/settlements.entity";
import { ANVITAPAY } from "@/constants/external-api.constant";
import { BanksService } from "@/modules/banks/banks.service";
import { WalletEntity } from "@/entities/wallet.entity";
import { convertExternalPaymentStatusToInternal } from "@/utils/helperFunctions.utils";
import { USERS_ROLE } from "@/enums";
import { getPagination } from "@/utils/pagination.utils";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { todayEndDate, todayStartDate } from "@/utils/date.utils";
import {
  calculateOriginalAmountFromNetPayable,
  getCommissions,
} from "@/utils/commissions.utils";

const {
  externalPaymentConfig: { baseUrl, clientId, clientSecret, clientSign },
} = appConfig();

@Injectable()
export class SettlementsService {
  private readonly logger = new CustomLogger(SettlementsService.name);
  private readonly axiosService = new AxiosService(baseUrl, {
    headers: {
      "Content-Type": "application/json",
      PPI: clientId,
      AUTH: clientSecret,
      SIGN: clientSign,
    },
  });

  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(SettlementsEntity)
    private readonly settlementsRepository: Repository<SettlementsEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
    @InjectRepository(PayInOrdersEntity)
    private readonly payinRepository: Repository<PayInOrdersEntity>,

    private readonly bankService: BanksService,
    private readonly dataSource: DataSource,
  ) {}

  async createWalletForMerchants() {
    const merchants = await this.usersRepository.find({
      where: {
        role: USERS_ROLE.MERCHANT,
      },
      relations: {
        wallet: true,
      },
    });

    for (const merchant of merchants) {
      if (!merchant.wallet) {
        await this.walletRepository.save({
          user: merchant,
        });
      }
    }

    return new MessageResponseDto("Wallets created successfully");
  }

  async getSettlementsStats() {
    const collections: {
      totalCollections: number;
    } = await this.payinRepository
      .createQueryBuilder("payin")
      .select("SUM(payin.amount)", "totalCollections")
      .where("payin.status = :status", { status: PAYMENT_STATUS.SUCCESS })
      .andWhere("payin.createdAt BETWEEN :startDate AND :endDate", {
        startDate: todayStartDate(),
        endDate: todayEndDate(),
      })
      .getRawOne();

    const settlements: {
      totalSettlements: number;
    } = await this.settlementsRepository
      .createQueryBuilder("settlement")
      .select("SUM(settlement.amount)", "totalSettlements")
      .where("settlement.status = :status", { status: PAYMENT_STATUS.SUCCESS })
      .andWhere("settlement.createdAt BETWEEN :startDate AND :endDate", {
        startDate: todayStartDate(),
        endDate: todayEndDate(),
      })
      .getRawOne();

    return {
      todayTotalCollections: +collections.totalCollections,
      todayTotalSettlements: +settlements.totalSettlements,
      todayTotalUnSettled:
        +collections.totalCollections - +settlements.totalSettlements,
    };
  }

  async getUnsettledAmountGroupedByUser({
    search = "",
    startDate = todayStartDate(),
    endDate = todayEndDate(),
    status = "UNSETTLED",
  }: GetSettlementListDto) {
    const calculateNetUnsettled = (
      collections: {
        collectedAmount: number;
        user: UsersEntity;
      }[],
      settlements: {
        settledAmount: number;
        user: UsersEntity;
      }[],
    ) => {
      const netAmounts = new Map<
        string,
        {
          collectedAmount: number;
          settledAmount: number;
          user: UsersEntity;
        }
      >();

      // Process collections
      collections.forEach(({ user, collectedAmount }) => {
        if (!netAmounts.has(user.id)) {
          netAmounts.set(user.id, {
            collectedAmount: 0,
            settledAmount: 0,
            user,
          });
        }
        const val = netAmounts.get(user.id);
        val.collectedAmount += collectedAmount;
        netAmounts.set(user.id, val);
      });

      // Process settlements
      settlements.forEach(({ user, settledAmount }) => {
        if (!netAmounts.has(user.id)) {
          netAmounts.set(user.id, {
            collectedAmount: 0,
            settledAmount: 0,
            user,
          });
        }
        const val = netAmounts.get(user.id);
        val.settledAmount += settledAmount;
        netAmounts.set(user.id, val);
      });

      return Array.from(netAmounts).map((val) => ({
        user: val[1].user,
        collectedAmount: +val[1].collectedAmount,
        settledAmount: +val[1].settledAmount,
        unsettledAmount: +val[1].collectedAmount - +val[1].settledAmount,
      }));
    };

    const payInUserGroup = await this.usersRepository.find({
      where: {
        ...(search && {
          fullName: ILike(`%${search}%`),
        }),
        payInOrders: {
          createdAt: Between(startDate, endDate),
          status: PAYMENT_STATUS.SUCCESS,
        },
      },
      relations: {
        payInOrders: true,
      },
    });

    const settlementUserGroup = await this.usersRepository.find({
      where: {
        ...(search && {
          fullName: ILike(`%${search}%`),
        }),
        settlements: {
          createdAt: Between(startDate, endDate),
          status: PAYMENT_STATUS.SUCCESS,
        },
      },
      relations: {
        settlements: true,
      },
    });

    const totalPayinGroupedByUser = payInUserGroup.map((user) => {
      const collectedAmount = user.payInOrders.reduce((acc, order) => {
        if (order.status === PAYMENT_STATUS.SUCCESS) {
          acc += +order.amount;
        }

        return acc;
      }, 0);

      return { collectedAmount, user };
    });

    const totalSettlementGroupedByUser = settlementUserGroup.map((user) => {
      const settledAmount = user.settlements.reduce((acc, order) => {
        if (order.status === PAYMENT_STATUS.SUCCESS) {
          acc += +order.amount;
        }

        return acc;
      }, 0);

      return { settledAmount, user };
    });

    const res = calculateNetUnsettled(
      totalPayinGroupedByUser,
      totalSettlementGroupedByUser,
    );

    if (status === "COLLECTIONS") {
      return res
        .filter((val) => !!val.collectedAmount)
        .map((val) => {
          const { totalServiceChange: _, ...rest } = getCommissions({
            amount: val.collectedAmount,
            commissionInPercentage: val.user.commissionInPercentagePayin,
            gstInPercentage: val.user.gstInPercentagePayin,
          });

          return {
            fullName: val.user.fullName,
            collectionAmount: +val.collectedAmount,
            status,
            ...rest,
          };
        });
    } else if (status === "SETTLED") {
      return res
        .filter((val) => !!val.settledAmount)
        .map((val) => {
          const { totalServiceChange: _, ...rest } = getCommissions({
            amount: val.settledAmount,
            commissionInPercentage: val.user.commissionInPercentagePayin,
            gstInPercentage: val.user.gstInPercentagePayin,
          });

          return {
            fullName: val.user.fullName,
            settledAmount: +val.settledAmount,
            status,
            ...rest,
          };
        });
    } else {
      return res
        .filter((val) => !!val.unsettledAmount)
        .map((val) => {
          const { totalServiceChange: _, ...rest } = getCommissions({
            amount: val.unsettledAmount,
            commissionInPercentage: val.user.commissionInPercentagePayin,
            gstInPercentage: val.user.gstInPercentagePayin,
          });

          return {
            fullName: val.user.fullName,
            unsettledAmount: +val.unsettledAmount,
            status,
            ...rest,
          };
        });
    }
  }

  async findAllSettlementsTransactions({
    limit = 10,
    page = 1,
    order = "DESC",
    sort = "id",
    search = "",
    startDate,
    endDate,
  }: PaginationWithDateDto) {
    const [data, totalItems] = await this.settlementsRepository.findAndCount({
      where: {
        ...(startDate && {
          createdAt: MoreThanOrEqual(new Date(startDate)),
        }),
        ...(endDate && {
          createdAt: LessThanOrEqual(new Date(endDate)),
        }),
        ...(search && {
          user: {
            fullName: ILike(`%${search}%`),
          },
        }),
      },
      relations: {
        user: true,
        settledBy: true,
      },
      select: {
        id: true,
        amount: true,
        status: true,
        transferId: true,
        transferMode: true,
        remarks: true,
        settledBy: {
          fullName: true,
        },
        createdAt: true,
        user: {
          fullName: true,
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

  async initiateSettlement(
    {
      amount,
      bankId,
      remarks,
      userId,
      transferMode,
    }: InitiateSettlementAdminDto,
    settledBy: UsersEntity,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: {
        address: true,
      },
    });

    if (!user) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    if (!user.address) {
      throw new NotFoundException(
        new MessageResponseDto("User address not found"),
      );
    }

    const banks = await this.bankService.getAllBanks(userId);

    const targetBank = banks.find((bank) => bank.id === bankId);

    if (!targetBank) {
      throw new NotFoundException(new MessageResponseDto("Bank not found"));
    }

    const queryRunner = this.dataSource.createQueryRunner();
    try {
      // Start transaction
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const wallet = await this.walletRepository.findOne({
        where: {
          user: {
            id: userId,
          },
        },
        relations: {
          user: true,
        },
      });

      if (!wallet) {
        throw new NotFoundException(
          new MessageResponseDto("User wallet not found"),
        );
      }

      if (+wallet.netPayableAmount < +amount) {
        throw new BadRequestException(
          new MessageResponseDto("Amount is greater than unsettled amount"),
        );
      }
      const originalAmount = calculateOriginalAmountFromNetPayable({
        netPayableAmount: +amount,
        commissionInPercentage: +wallet.user.commissionInPercentagePayin,
        gstInPercentage: +wallet.user.gstInPercentagePayin,
      });

      const commission = getCommissions({
        amount: originalAmount,
        commissionInPercentage: +wallet.user.commissionInPercentagePayin,
        gstInPercentage: +wallet.user.gstInPercentagePayin,
      });

      const newWallet = this.walletRepository.create({
        id: wallet.id,
        settledAmount: +wallet.settledAmount + +originalAmount,
        unsettledAmount: +wallet.unsettledAmount - +originalAmount,
        netPayableAmount: +wallet.netPayableAmount - +amount,
        commissionAmount:
          +wallet.commissionAmount - +commission.commissionAmount,
        gstAmount: +wallet.gstAmount - +commission.gstAmount,
      });

      await queryRunner.manager.save(newWallet);

      const settlement = this.settlementsRepository.create({
        amount: +amount,
        transferMode,
        user,
        settledBy,
        remarks,
      });

      const savedSettlement = await queryRunner.manager.save(settlement);

      this.logger.info(
        `SETTLEMENT - initiateSettlements - Sending Settlements Amount: ${amount} to USER ${user.fullName} (${user.id}) & Bank Details: ${LoggerPlaceHolder.Json}`,
        targetBank,
      );

      const payload: IExternalPayoutRequest = {
        amount: +amount,
        bene_name: targetBank.name,
        email: targetBank.email,
        mobile: targetBank.mobile,
        account: targetBank.accountNumber,
        ifsc: targetBank.bankIFSC,
        Address: user.address.address || "",
        mode: transferMode,
        ref_no: savedSettlement.id,
        Remark: remarks,
      };

      this.logger.info(
        `SETTLEMENT - initiateSettlements - Calling PAYOUT: ${baseUrl}/${ANVITAPAY.PAYOUT} with payload: ${LoggerPlaceHolder.Json}`,
        payload,
      );

      const externalPayoutResponse =
        await this.axiosService.postRequest<IExternalPayoutResponse>(
          ANVITAPAY.PAYOUT,
          payload,
        );

      this.logger.info(
        `SETTLEMENT - initiateSettlements - External Payout Response: ${LoggerPlaceHolder.Json}`,
        externalPayoutResponse,
      );

      if (externalPayoutResponse.res_code !== ANVITAPAY.STATUS.SUCCESS) {
        throw new BadRequestException(externalPayoutResponse.msg);
      }

      await queryRunner.manager.update(
        SettlementsEntity,
        { id: savedSettlement.id },
        {
          transferId: externalPayoutResponse.data.Utr,
          status: convertExternalPaymentStatusToInternal(
            externalPayoutResponse.data.status,
          ),
        },
      );

      await queryRunner.commitTransaction();

      return {
        orderId: externalPayoutResponse.data.Ref_No,
        externalId: externalPayoutResponse.data.ID,
        amount: externalPayoutResponse.data.Amount,
        ...(externalPayoutResponse.data?.Utr && {
          UTR: externalPayoutResponse.data.Utr,
        }),
      };
    } catch (err) {
      this.logger.error(
        `SETTLEMENT - initiateSettlements - error: ${LoggerPlaceHolder.Json}`,
        err,
      );
      await queryRunner.rollbackTransaction();

      throw new BadRequestException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async getPendingSettlements({
    limit = 10,
    page = 1,
    search = "",
  }: PaginationWithoutSortAndOrderDto) {
    const [settlements, totalItems] = await this.usersRepository.findAndCount({
      where: {
        role: USERS_ROLE.MERCHANT,
        ...(search && {
          fullName: ILike(`%${search}%`),
        }),
      },
      relations: {
        wallet: true,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const pagination = getPagination({
      totalItems,
      page,
      limit,
    });

    const data = settlements.map((settlement) => {
      if (!settlement.wallet) {
        throw new NotFoundException(
          new MessageResponseDto(
            "User wallet not found for: " + settlement.fullName,
          ),
        );
      }

      return {
        id: settlement.id,
        name: settlement.fullName,
        unsettledAmount: +settlement.wallet.unsettledAmount,
        netUnsettledPayableAmount: +settlement.wallet.netPayableAmount,
        gstAmount: +settlement.wallet.gstAmount,
        commissionAmount: +settlement.wallet.commissionAmount,
      };
    });

    return {
      data,
      pagination,
    };
  }

  async getPendingSettlementsByUserId(userId: string) {
    const settlement = await this.usersRepository.findOne({
      where: {
        role: USERS_ROLE.MERCHANT,
        id: userId,
      },
      relations: {
        wallet: true,
      },
    });

    if (!settlement) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    if (!settlement.wallet) {
      throw new NotFoundException(
        new MessageResponseDto("User wallet not found"),
      );
    }

    return {
      id: settlement.id,
      name: settlement.fullName,
      unsettledAmount: +settlement.wallet.unsettledAmount,
      netUnsettledPayableAmount: +settlement.wallet.netPayableAmount,
      gstAmount: +settlement.wallet.gstAmount,
      commissionAmount: +settlement.wallet.commissionAmount,
    };
  }

  async getAllSettlementsForMerchant(
    userId: string,
    {
      limit = 10,
      page = 1,
      order = "DESC",
      sort = "id",
      search = "",
      startDate = todayStartDate(),
      endDate = todayEndDate(),
    }: PaginationWithDateDto,
  ) {
    const [data, totalItems] = await this.settlementsRepository.findAndCount({
      where: [
        {
          user: {
            id: userId,
          },
          createdAt: Between(new Date(startDate), new Date(endDate)),
        },
        ...(search && [
          {
            user: {
              fullName: ILike(`%${search}%`),
            },
            createdAt: Between(new Date(startDate), new Date(endDate)),
          },
        ]),
      ],

      relations: {
        user: true,
      },
      select: {
        id: true,
        amount: true,
        status: true,
        transferId: true,
        transferMode: true,
        remarks: true,
        createdAt: true,
        user: {
          id: true,
          fullName: true,
          email: true,
        },
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

    return { data, pagination };
  }
}
