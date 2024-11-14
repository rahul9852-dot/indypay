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
} from "typeorm";
import { InitiateSettlementAdminDto } from "./dto/initate-settlement-admin.dto";
import { GetSettlementListDto } from "./dto/get-settlement-list.dto";
import { MessageResponseDto, PaginationWithDateDto } from "@/dtos/common.dto";
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

    const walletsPromises = merchants
      .filter(({ wallet }) => !!wallet)
      .map((merchant) => {
        const newWallet = this.walletRepository.create({
          user: merchant,
        });

        return this.walletRepository.save(newWallet);
      });

    await Promise.all(walletsPromises);

    return new MessageResponseDto("Wallets created successfully");
  }

  async getSettlementsList({ search = "" }: GetSettlementListDto) {
    return this.walletRepository.find({
      where: {
        ...(search && {
          user: {
            fullName: ILike(`%${search}%`),
          },
        }),
        user: {
          role: USERS_ROLE.MERCHANT,
        },
      },
      relations: {
        user: true,
      },
      select: {
        id: true,
        settledAmount: true,
        unsettledAmount: true,
        totalCollections: true,
        user: {
          fullName: true,
        },
      },
    });
  }

  async findAll({
    limit = 10,
    page = 1,
    order = "DESC",
    sort = "id",
    search = "",
    startDate,
    endDate,
  }: PaginationWithDateDto) {
    return await this.settlementsRepository.find({
      where: {
        ...(startDate && {
          createdAt: MoreThanOrEqual(startDate),
        }),
        ...(endDate && {
          createdAt: LessThanOrEqual(endDate),
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
      });

      if (!wallet) {
        throw new NotFoundException(
          new MessageResponseDto("User wallet not found"),
        );
      }

      if (+wallet.unsettledAmount < +amount) {
        throw new BadRequestException(
          new MessageResponseDto("Amount is greater than unsettled amount"),
        );
      }
      const newWallet = this.walletRepository.create({
        id: wallet.id,
        settledAmount: +wallet.settledAmount + +amount,
        unsettledAmount: +wallet.unsettledAmount - +amount,
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
        ...(externalPayoutResponse.data.Utr && {
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
}
