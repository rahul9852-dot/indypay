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
  Between,
  FindOptionsWhere,
  MoreThanOrEqual,
  LessThanOrEqual,
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
import { SettlementsEntity } from "@/entities/settlements.entity";
import {
  ANVITAPAY,
  ISMART_PAY,
  PAYNPRO,
} from "@/constants/external-api.constant";
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
import {
  IExternalPayoutRequestAnviNeo,
  IExternalPayoutRequestIsmart,
  IExternalPayoutRequestPayNPro,
  IExternalPayoutResponseAnviNeo,
  IExternalPayoutResponseIsmart,
  IExternalPayoutResponsePayNPro,
  IExternalPayoutStatusRequestPayNPro,
  IExternalPayoutStatusResponseIsmart,
  IExternalPayoutStatusResponsePayNPro,
} from "@/interface/external-api.interface";

const {
  externalPaymentConfig: {
    payoutSignature,
    payoutClientId,
    payoutClientSecret,
  },
} = appConfig();
@Injectable()
export class SettlementsService {
  private readonly logger = new CustomLogger(SettlementsService.name);
  private readonly axiosService = new AxiosService(PAYNPRO.PAYOUT.BASE_URL, {
    headers: {
      "Content-Type": "application/json",
      "X-APIKEY": payoutClientId,
      "X-APISECRET": payoutClientSecret,
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

    const walletPromises = merchants
      .filter((merchant) => !merchant.wallet)
      .map((merchant) =>
        this.walletRepository.create({
          user: merchant,
        }),
      );

    await this.walletRepository.save(walletPromises);

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

  async findAllSettlementsTransactions(
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
    if ([USERS_ROLE.ADMIN, USERS_ROLE.OWNER].includes(user.role)) {
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

  async initiateSettlementAnviNeo(
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
        bankDetails: targetBank,
      });

      const savedSettlement = await queryRunner.manager.save(settlement);

      this.logger.info(
        `SETTLEMENT - initiateSettlements - Sending Settlements Amount: ${amount} to USER ${user.fullName} (${user.id}) & Bank Details: ${LoggerPlaceHolder.Json}`,
        targetBank,
      );

      const payload: IExternalPayoutRequestAnviNeo = {
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
        `SETTLEMENT - initiateSettlements - Calling PAYOUT: ${ANVITAPAY.PAYOUT} with payload: ${LoggerPlaceHolder.Json}`,
        payload,
      );

      const externalPayoutResponse =
        await this.axiosService.postRequest<IExternalPayoutResponseAnviNeo>(
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

  async initiateSettlementIsmart(
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
        bankDetails: targetBank,
      });

      const savedSettlement = await queryRunner.manager.save(settlement);

      this.logger.info(
        `SETTLEMENT - initiateSettlements - Sending Settlements Amount: ${amount} to USER ${user.fullName} (${user.id}) & Bank Details: ${LoggerPlaceHolder.Json}`,
        targetBank,
      );

      const payload: IExternalPayoutRequestIsmart = {
        amount: +amount,
        currency: "INR",
        narration: remarks,
        order_id: savedSettlement.id,
        phone_number: targetBank.mobile,
        purpose: "Settlement Fund",
        payment_details: {
          account_number: targetBank.accountNumber,
          ifsc_code: targetBank.bankIFSC,
          beneficiary_name: targetBank.name,
          type: "NB",
          mode: transferMode,
        },
      };

      this.logger.info(
        `SETTLEMENT - initiateSettlements - Calling PAYOUT: ${ISMART_PAY.PAYOUT} with payload: ${LoggerPlaceHolder.Json}`,
        payload,
      );

      const externalPayoutResponse =
        await this.axiosService.postRequest<IExternalPayoutResponseIsmart>(
          ISMART_PAY.PAYOUT,
          payload,
        );

      this.logger.info(
        `SETTLEMENT - initiateSettlements - External Payout Response: ${LoggerPlaceHolder.Json}`,
        externalPayoutResponse,
      );

      if (!externalPayoutResponse.status) {
        throw new BadRequestException(
          externalPayoutResponse?.errors || "Something went wrong",
        );
      }

      const status = convertExternalPaymentStatusToInternal(
        externalPayoutResponse.status_code,
      );

      await queryRunner.manager.update(
        SettlementsEntity,
        { id: savedSettlement.id },
        {
          transferId: externalPayoutResponse.transaction_id,
          status,
        },
      );

      await queryRunner.commitTransaction();

      return {
        orderId: externalPayoutResponse.order_id,
        amount: externalPayoutResponse.amount,
        transferId: externalPayoutResponse.transaction_id,
        status,
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

  async initiateSettlementPayNPro(
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
        bankDetails: targetBank,
      });

      const savedSettlement = await queryRunner.manager.save(settlement);

      this.logger.info(
        `SETTLEMENT - initiateSettlements - Sending Settlements Amount: ${amount} to USER ${user.fullName} (${user.id}) & Bank Details: ${LoggerPlaceHolder.Json}`,
        targetBank,
      );

      const payload: IExternalPayoutRequestPayNPro = {
        amount: (+amount).toFixed(2),
        purpose: remarks,
        payout_ref: savedSettlement.id,
        mob_no: targetBank.mobile,
        email_id: targetBank.email,
        recv_acc_no: targetBank.accountNumber,
        recv_bank_ifsc: targetBank.bankIFSC,
        recv_bank_name: targetBank.bankName,
        recv_name: targetBank.name,
        txn_type: transferMode,
        username: user.fullName,
        signature: payoutSignature,
      };

      this.logger.info(
        `SETTLEMENT - initiateSettlements - Calling PAYOUT: ${PAYNPRO.PAYOUT.BASE_URL}/${PAYNPRO.PAYOUT.LIVE_ENDPOINT} with payload: ${LoggerPlaceHolder.Json}`,
        payload,
      );

      const externalPayoutResponse =
        await this.axiosService.postRequest<IExternalPayoutResponsePayNPro>(
          PAYNPRO.PAYOUT.LIVE_ENDPOINT,
          payload,
        );

      this.logger.info(
        `SETTLEMENT - initiateSettlements - External Payout Response: ${LoggerPlaceHolder.Json}`,
        externalPayoutResponse,
      );

      if (externalPayoutResponse.statusCode.toString() !== "200") {
        throw new BadRequestException(
          externalPayoutResponse?.error || "Something went wrong",
        );
      }

      const status = convertExternalPaymentStatusToInternal(
        externalPayoutResponse.Data.status.toUpperCase(),
      );

      await queryRunner.manager.update(
        SettlementsEntity,
        { id: savedSettlement.id },
        {
          transferId: externalPayoutResponse.Data.txn_id,
          status,
        },
      );

      await queryRunner.commitTransaction();

      return {
        orderId: externalPayoutResponse.Data.payout_ref,
        amount: externalPayoutResponse.Data.amount,
        transferId: externalPayoutResponse.Data.txn_id,
        status,
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

    const data = settlements
      .filter((settlement) => !!settlement.wallet)
      .map((settlement) => {
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

  async checkSettlementStatusIsmart(settlementId: string) {
    const settlement = await this.settlementsRepository.findOne({
      where: {
        id: settlementId,
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

    // call third party api
    const response =
      await this.axiosService.getRequest<IExternalPayoutStatusResponseIsmart>(
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
  async checkSettlementStatusPayNPro(settlementId: string) {
    const settlement = await this.settlementsRepository.findOne({
      where: {
        id: settlementId,
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

    // call third party api
    const payload: IExternalPayoutStatusRequestPayNPro = {
      payout_ref: settlementId,
      signature: payoutSignature,
    };
    const response =
      await this.axiosService.postRequest<IExternalPayoutStatusResponsePayNPro>(
        PAYNPRO.PAYOUT.STATUS,
        payload,
      );

    if (response.statusCode?.toString() !== "200") {
      throw new BadRequestException(
        new MessageResponseDto(response?.error || "Something went wrong!"),
      );
    }

    const status = convertExternalPaymentStatusToInternal(
      response.data?.[0]?.status?.toUpperCase(),
    );

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
