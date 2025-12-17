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
import { MessageResponseDto, PaginationWithDateDto } from "@/dtos/common.dto";
import { UsersEntity } from "@/entities/user.entity";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";
import { AxiosService } from "@/shared/axios/axios.service";
import { appConfig } from "@/config/app.config";
import { SettlementsEntity } from "@/entities/settlements.entity";
import {
  BUCKBOX,
  ERTITECH,
  ISMART_PAY,
} from "@/constants/external-api.constant";
import { BanksService } from "@/modules/banks/banks.service";
import { WalletEntity } from "@/entities/wallet.entity";
import { convertExternalPaymentStatusToInternal } from "@/utils/helperFunctions.utils";
import {
  ACCOUNT_STATUS,
  ONBOARDING_STATUS,
  SETTLEMENT_TYPE,
  USERS_ROLE,
} from "@/enums";
import { getPagination } from "@/utils/pagination.utils";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { todayEndDate, todayStartDate } from "@/utils/date.utils";
import {
  getCommissions,
  getPayoutCommissions,
} from "@/utils/commissions.utils";
import {
  IExternalPayoutStatusResponseIsmart,
  IExternalEritecPayoutFundResponse,
  IExternalBuckboxPayoutFundResponse,
} from "@/interface/external-api.interface";

import { EmailService } from "@/shared/services/email.service";
import { InvoiceService } from "@/shared/services/invoice.service";
import { UserAddressEntity } from "@/entities/user-address.entity";
import {
  // getFlakPayPgConfig,
  getIsmartPayPgConfig,
  getEritechPgConfig,
} from "@/utils/pg-config.utils";
import { decryptData } from "@/utils/encode-decode.utils";
import { ApiCredentialsEntity } from "@/entities/api-credentials.entity";
import { WalletTopupEntity } from "@/entities/wallet-topup.entity";
import { ThirdPartyAuthService } from "@/shared/third-party-auth/third-party-auth.service";

const { externalPaymentConfig } = appConfig();
@Injectable()
export class SettlementsService {
  private readonly logger = new CustomLogger(SettlementsService.name);

  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(SettlementsEntity)
    private readonly settlementsRepository: Repository<SettlementsEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
    @InjectRepository(PayInOrdersEntity)
    private readonly payinRepository: Repository<PayInOrdersEntity>,
    @InjectRepository(UserAddressEntity)
    private readonly addressRepository: Repository<UserAddressEntity>,
    @InjectRepository(ApiCredentialsEntity)
    private readonly apiCredentialsRepository: Repository<ApiCredentialsEntity>,
    @InjectRepository(WalletTopupEntity)
    private readonly walletTopupRepository: Repository<WalletTopupEntity>,

    private readonly bankService: BanksService,
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
    private readonly invoiceService: InvoiceService,
    private readonly thirdPartyAuthService: ThirdPartyAuthService,
  ) {}

  async createWalletForMerchants() {
    const merchants = await this.usersRepository.find({
      // where: {
      //   role: USERS_ROLE.MERCHANT,
      // },
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
      .select("SUM(settlement.collectionAmount)", "totalSettlements")
      .where("settlement.status = :status", { status: PAYMENT_STATUS.SUCCESS })
      .andWhere("settlement.createdAt BETWEEN :startDate AND :endDate", {
        startDate: todayStartDate(),
        endDate: todayEndDate(),
      })
      .getRawOne();

    const totalTopUp = await this.walletTopupRepository.sum(
      "collectionAmount",
      {
        createdAt: Between(
          new Date(todayStartDate()),
          new Date(todayEndDate()),
        ),
      },
    );

    const grossTotalSettlement = +settlements.totalSettlements + +totalTopUp;

    return {
      todayTotalCollections: +collections.totalCollections,
      todayTotalSettlements: grossTotalSettlement,
      todayTotalUnSettled:
        +collections.totalCollections - grossTotalSettlement < 0
          ? 0
          : +collections.totalCollections - grossTotalSettlement,
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
          acc += +order.amountAfterDeduction;
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
      limit = 50,
      page = 1,
      order = "DESC",
      sort = "id",
      search = "",
      startDate,
      endDate,
    }: PaginationWithDateDto,
    user: UsersEntity,
  ) {
    // Create base query with date filters
    const baseWhereQuery: FindOptionsWhere<SettlementsEntity> = {};

    // Date Filter
    if (startDate && endDate) {
      baseWhereQuery.createdAt = Between(
        new Date(startDate),
        new Date(endDate),
      );
    } else if (startDate) {
      baseWhereQuery.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      baseWhereQuery.createdAt = LessThanOrEqual(new Date(endDate));
    }

    // for admin user
    if ([USERS_ROLE.ADMIN, USERS_ROLE.OWNER].includes(user.role)) {
      const query = [];

      if (search) {
        // Search by transferId with date filters
        query.push({
          ...baseWhereQuery,
          transferId: ILike(`%${search}%`),
        });

        // Search by user fullName with date filters
        query.push({
          ...baseWhereQuery,
          user: {
            fullName: ILike(`%${search}%`),
          },
        });
      } else {
        // No search, just use base query
        query.push(baseWhereQuery);
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
          collectionAmount: true,
          serviceCharge: true,
          amountAfterDeduction: true,
          status: true,
          transferId: true,
          transferMode: true,
          utr: true,
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
      // For non-admin users, always filter by user ID
      baseWhereQuery.user = { id: user.id };

      const query = [];

      if (search) {
        // Search by transferId while maintaining user filter
        query.push({
          ...baseWhereQuery,
          transferId: ILike(`%${search}%`),
        });

        // Optionally add more search conditions if needed
        // For example, search by UTR
        query.push({
          ...baseWhereQuery,
          utr: ILike(`%${search}%`),
        });
      } else {
        // No search, just use base query with user filter
        query.push(baseWhereQuery);
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
          collectionAmount: true,
          serviceCharge: true,
          amountAfterDeduction: true,
          status: true,
          transferId: true,
          transferMode: true,
          utr: true,
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

  // async initiateSettlementAnviNeo(
  //   {
  //     amount,
  //     bankId,
  //     remarks,
  //     userId,
  //     transferMode,
  //   }: InitiateSettlementAdminDto,
  //   settledBy: UsersEntity,
  // ) {
  //   const user = await this.usersRepository.findOne({
  //     where: { id: userId },
  //     relations: {
  //       address: true,
  //     },
  //   });

  //   if (!user) {
  //     throw new NotFoundException(new MessageResponseDto("User not found"));
  //   }

  //   if (!user.address) {
  //     throw new NotFoundException(
  //       new MessageResponseDto("User address not found"),
  //     );
  //   }

  //   const banks = await this.bankService.getAllBanks(userId);

  //   const targetBank = banks.find((bank) => bank.id === bankId);

  //   if (!targetBank) {
  //     throw new NotFoundException(new MessageResponseDto("Bank not found"));
  //   }

  //   const queryRunner = this.dataSource.createQueryRunner();
  //   try {
  //     // Start transaction
  //     await queryRunner.connect();
  //     await queryRunner.startTransaction();

  //     const wallet = await this.walletRepository.findOne({
  //       where: {
  //         user: {
  //           id: userId,
  //         },
  //       },
  //       relations: {
  //         user: true,
  //       },
  //     });

  //     if (!wallet) {
  //       throw new NotFoundException(
  //         new MessageResponseDto("User wallet not found"),
  //       );
  //     }

  //     if (+wallet.netPayableAmount < +amount) {
  //       throw new BadRequestException(
  //         new MessageResponseDto("Amount is greater than unsettled amount"),
  //       );
  //     }
  //     const originalAmount = calculateOriginalAmountFromNetPayable({
  //       netPayableAmount: +amount,
  //       commissionInPercentage: +wallet.user.commissionInPercentagePayin,
  //       gstInPercentage: +wallet.user.gstInPercentagePayin,
  //     });

  //     const commission = getCommissions({
  //       amount: originalAmount,
  //       commissionInPercentage: +wallet.user.commissionInPercentagePayin,
  //       gstInPercentage: +wallet.user.gstInPercentagePayin,
  //     });

  //     const newWallet = this.walletRepository.create({
  //       id: wallet.id,
  //       settledAmount: +wallet.settledAmount + +originalAmount,
  //       unsettledAmount: +wallet.unsettledAmount - +originalAmount,
  //       netPayableAmount: +wallet.netPayableAmount - +amount,
  //       commissionAmount:
  //         +wallet.commissionAmount - +commission.commissionAmount,
  //       gstAmount: +wallet.gstAmount - +commission.gstAmount,
  //     });

  //     await queryRunner.manager.save(newWallet);

  //     const settlement = this.settlementsRepository.create({
  //       amount: +amount,
  //       transferMode,
  //       user,
  //       settledBy,
  //       remarks,
  //       bankDetails: targetBank,
  //     });

  //     const savedSettlement = await queryRunner.manager.save(settlement);

  //     this.logger.info(
  //       `SETTLEMENT - initiateSettlements - Sending Settlements Amount: ${amount} to USER ${user.fullName} (${user.id}) & Bank Details: ${LoggerPlaceHolder.Json}`,
  //       targetBank,
  //     );

  //     const payload: IExternalPayoutRequestAnviNeo = {
  //       amount: +amount,
  //       bene_name: targetBank.name,
  //       email: targetBank.email,
  //       mobile: targetBank.mobile,
  //       account: targetBank.accountNumber,
  //       ifsc: targetBank.bankIFSC,
  //       Address: user.address.address || "",
  //       mode: transferMode,
  //       ref_no: savedSettlement.id,
  //       Remark: remarks,
  //     };

  //     this.logger.info(
  //       `SETTLEMENT - initiateSettlements - Calling PAYOUT: ${ANVITAPAY.PAYOUT} with payload: ${LoggerPlaceHolder.Json}`,
  //       payload,
  //     );

  //     const externalPayoutResponse =
  //       await this.axiosService.postRequest<IExternalPayoutResponseAnviNeo>(
  //         ANVITAPAY.PAYOUT,
  //         payload,
  //       );

  //     this.logger.info(
  //       `SETTLEMENT - initiateSettlements - External Payout Response: ${LoggerPlaceHolder.Json}`,
  //       externalPayoutResponse,
  //     );

  //     if (externalPayoutResponse.res_code !== ANVITAPAY.STATUS.SUCCESS) {
  //       throw new BadRequestException(externalPayoutResponse.msg);
  //     }

  //     await queryRunner.manager.update(
  //       SettlementsEntity,
  //       { id: savedSettlement.id },
  //       {
  //         transferId: externalPayoutResponse.data.Utr,
  //         status: convertExternalPaymentStatusToInternal(
  //           externalPayoutResponse.data.status,
  //         ),
  //       },
  //     );

  //     await queryRunner.commitTransaction();

  //     return {
  //       orderId: externalPayoutResponse.data.Ref_No,
  //       externalId: externalPayoutResponse.data.ID,
  //       amount: externalPayoutResponse.data.Amount,
  //       ...(externalPayoutResponse.data?.Utr && {
  //         UTR: externalPayoutResponse.data.Utr,
  //       }),
  //     };
  //   } catch (err) {
  //     this.logger.error(
  //       `SETTLEMENT - initiateSettlements - error: ${LoggerPlaceHolder.Json}`,
  //       err,
  //     );
  //     await queryRunner.rollbackTransaction();

  //     throw new BadRequestException(err.message);
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  async sendSettlementInvoice(
    settlementId: string,
    status: "Initiated" | "Completed",
  ) {
    const settlement = await this.settlementsRepository.findOne({
      where: {
        id: settlementId,
      },
      relations: {
        user: true,
        settledBy: true,
        bankDetails: true,
      },
    });

    if (!settlement) {
      throw new NotFoundException(
        new MessageResponseDto("Settlement not found"),
      );
    }

    try {
      const userAddress = await this.addressRepository.findOne({
        where: {
          user: {
            id: settlement.user.id,
          },
        },
        relations: {
          user: true,
        },
      });

      if (!settlement.bankDetails) {
        throw new NotFoundException(
          new MessageResponseDto("Bank Details not found"),
        );
      }

      const pdf = await this.invoiceService.generateInvoicePDF({
        amount: +settlement.amountAfterDeduction,
        transferMode: settlement.transferMode,
        userName: settlement.user.fullName,
        settledBy: settlement.settledBy.fullName,
        remarks: settlement.remarks,
        bankDetails: {
          accountNumber: settlement.bankDetails.accountNumber,
          ifscCode: settlement.bankDetails.bankIFSC,
          bankName: settlement.bankDetails.bankName,
          accountHolderName: settlement.bankDetails.name,
        },
        status,
        dateTime: new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
        address: {
          billing: {
            name: settlement.user.fullName,
            street: userAddress.address,
            city: userAddress.city,
            state: userAddress.state,
            zip: userAddress.pincode,
            country: userAddress.country,
          },
          shipping: {
            name: "PayBolt Technologies Pvt. Ltd.",
            street: "#1068, 3rd Floor, 1st Stage, Kumaraswamy Layout",
            city: "Bengaluru",
            state: "Karnataka",
            zip: "560078",
            country: "India",
          },
        },
      });

      this.logger.info(
        `SETTLEMENT - sendSettlementInvoice - Sending Settlement Invoice to USER ${settlement.user.fullName} (${settlement.user.id}) & Bank Details: ${LoggerPlaceHolder.Json}`,
        settlement.bankDetails,
      );

      this.emailService.sendEmail(
        settlement.user.email,
        `Settlement ${status} - PayBolt`,
        `Your settlement request for ₹${settlement.amountAfterDeduction} has been ${status.toLowerCase()}.`,
        [
          {
            filename: `settlement-${status.toLowerCase()}-${settlement.id}.pdf`,
            content: pdf,
          },
        ],
      );
    } catch (error) {
      this.logger.error(`Failed to send settlement ${status} invoice`, error);
      // Don't throw error as this is a non-critical operation
    }
  }

  // async initiateSettlementPayNPro(
  //   {
  //     amount,
  //     bankId,
  //     remarks,
  //     userId,
  //     transferMode,
  //   }: InitiateSettlementAdminDto,
  //   settledBy: UsersEntity,
  // ) {
  //   const user = await this.usersRepository.findOne({
  //     where: { id: userId },
  //     relations: {
  //       address: true,
  //     },
  //   });

  //   if (!user) {
  //     throw new NotFoundException(new MessageResponseDto("User not found"));
  //   }

  //   if (!user.address) {
  //     throw new NotFoundException(
  //       new MessageResponseDto("User address not found"),
  //     );
  //   }

  //   const banks = await this.bankService.getAllBanks(userId);

  //   const targetBank = banks.find((bank) => bank.id === bankId);

  //   if (!targetBank) {
  //     throw new NotFoundException(new MessageResponseDto("Bank not found"));
  //   }

  //   const queryRunner = this.dataSource.createQueryRunner();
  //   try {
  //     // Start transaction
  //     await queryRunner.connect();
  //     await queryRunner.startTransaction();

  //     const wallet = await this.walletRepository.findOne({
  //       where: {
  //         user: {
  //           id: userId,
  //         },
  //       },
  //       relations: {
  //         user: true,
  //       },
  //     });

  //     if (!wallet) {
  //       throw new NotFoundException(
  //         new MessageResponseDto("User wallet not found"),
  //       );
  //     }

  //     if (+wallet.netPayableAmount < +amount) {
  //       throw new BadRequestException(
  //         new MessageResponseDto("Amount is greater than unsettled amount"),
  //       );
  //     }
  //     const originalAmount = calculateOriginalAmountFromNetPayable({
  //       netPayableAmount: +amount,
  //       commissionInPercentage: +wallet.user.commissionInPercentagePayin,
  //       gstInPercentage: +wallet.user.gstInPercentagePayin,
  //     });

  //     const commission = getCommissions({
  //       amount: originalAmount,
  //       commissionInPercentage: +wallet.user.commissionInPercentagePayin,
  //       gstInPercentage: +wallet.user.gstInPercentagePayin,
  //     });

  //     const newWallet = this.walletRepository.create({
  //       id: wallet.id,
  //       settledAmount: +wallet.settledAmount + +originalAmount,
  //       unsettledAmount: +wallet.unsettledAmount - +originalAmount,
  //       netPayableAmount: +wallet.netPayableAmount - +amount,
  //       commissionAmount:
  //         +wallet.commissionAmount - +commission.commissionAmount,
  //       gstAmount: +wallet.gstAmount - +commission.gstAmount,
  //     });

  //     await queryRunner.manager.save(newWallet);

  //     const settlement = this.settlementsRepository.create({
  //       amount: +amount,
  //       transferMode,
  //       user,
  //       settledBy,
  //       remarks,
  //       bankDetails: targetBank,
  //     });

  //     const savedSettlement = await queryRunner.manager.save(settlement);

  //     this.logger.info(
  //       `SETTLEMENT - initiateSettlements - Sending Settlements Amount: ${amount} to USER ${user.fullName} (${user.id}) & Bank Details: ${LoggerPlaceHolder.Json}`,
  //       targetBank,
  //     );

  //     const payload: IExternalPayoutRequestPayNPro = {
  //       amount: (+amount).toFixed(2),
  //       purpose: remarks,
  //       payout_ref: savedSettlement.id,
  //       mob_no: targetBank.mobile,
  //       email_id: targetBank.email,
  //       recv_acc_no: targetBank.accountNumber,
  //       recv_bank_ifsc: targetBank.bankIFSC,
  //       recv_bank_name: targetBank.bankName,
  //       recv_name: targetBank.name,
  //       txn_type: transferMode,
  //       username: user.fullName,
  //       signature: payoutSignature,
  //     };

  //     this.logger.info(
  //       `SETTLEMENT - initiateSettlements - Calling PAYOUT: ${PAYNPRO.PAYOUT.BASE_URL}/${PAYNPRO.PAYOUT.LIVE_ENDPOINT} with payload: ${LoggerPlaceHolder.Json}`,
  //       payload,
  //     );

  //     const externalPayoutResponse =
  //       await this.axiosService.postRequest<IExternalPayoutResponsePayNPro>(
  //         PAYNPRO.PAYOUT.LIVE_ENDPOINT,
  //         payload,
  //       );

  //     this.logger.info(
  //       `SETTLEMENT - initiateSettlements - External Payout Response: ${LoggerPlaceHolder.Json}`,
  //       externalPayoutResponse,
  //     );

  //     if (externalPayoutResponse.statusCode.toString() !== "200") {
  //       throw new BadRequestException(
  //         externalPayoutResponse?.error || "Something went wrong",
  //       );
  //     }

  //     const status = convertExternalPaymentStatusToInternal(
  //       externalPayoutResponse.Data.status.toUpperCase(),
  //     );

  //     await queryRunner.manager.update(
  //       SettlementsEntity,
  //       { id: savedSettlement.id },
  //       {
  //         transferId: externalPayoutResponse.Data.txn_id,
  //         status,
  //       },
  //     );

  //     await queryRunner.commitTransaction();

  //     await this.sendSettlementInvoice(savedSettlement.id, "Initiated");
  //     if (status === PAYMENT_STATUS.SUCCESS) {
  //       await this.sendSettlementInvoice(savedSettlement.id, "Completed");
  //     }

  //     return {
  //       orderId: externalPayoutResponse.Data.payout_ref,
  //       amount: externalPayoutResponse.Data.amount,
  //       transferId: externalPayoutResponse.Data.txn_id,
  //       status,
  //     };
  //   } catch (err) {
  //     this.logger.error(
  //       `SETTLEMENT - initiateSettlements - error: ${LoggerPlaceHolder.Json}`,
  //       err,
  //     );
  //     await queryRunner.rollbackTransaction();

  //     throw new BadRequestException(err.message);
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  private async getFlakPayCredentials(userId: string) {
    const credentials = await this.apiCredentialsRepository.findOne({
      where: { user: { id: userId } },
      relations: { user: true },
    });

    if (!credentials) {
      throw new BadRequestException("Credentials not found");
    }

    const decryptedCredentials = await decryptData(credentials.credentials);
    const { clientId, clientSecret } = JSON.parse(decryptedCredentials);

    if (
      !clientId ||
      !clientSecret ||
      typeof clientId !== "string" ||
      typeof clientSecret !== "string"
    ) {
      throw new BadRequestException("Invalid credentials");
    }

    return { clientId, clientSecret };
  }

  // async initiateSettlementFalkPay(
  //   {
  //     amount: collectionAmount,
  //     bankId,
  //     remarks,
  //     userId,
  //     transferMode,
  //   }: InitiateSettlementAdminDto,
  //   settledBy: UsersEntity,
  // ) {
  //   const user = await this.usersRepository.findOne({
  //     where: { id: userId },
  //     relations: {
  //       address: true,
  //     },
  //   });

  //   if (!user) {
  //     throw new NotFoundException(new MessageResponseDto("User not found"));
  //   }

  //   const { clientId, clientSecret } = externalPaymentConfig.flakPay;

  //   const axiosServiceFlakPay = new AxiosService(
  //     FALKPAY.BASE_URL,
  //     getFlakPayPgConfig({
  //       clientId,
  //       clientSecret,
  //     }),
  //   );

  //   if (!user.address) {
  //     throw new NotFoundException(
  //       new MessageResponseDto("User address not found"),
  //     );
  //   }

  //   const banks = await this.bankService.getAllBanks(userId);

  //   const targetBank = banks.find((bank) => bank.id === bankId);

  //   if (!targetBank) {
  //     throw new NotFoundException(new MessageResponseDto("Bank not found"));
  //   }

  //   const queryRunner = this.dataSource.createQueryRunner();
  //   try {
  //     // Start transaction
  //     await queryRunner.connect();
  //     await queryRunner.startTransaction();

  //     const wallet = await this.walletRepository.findOne({
  //       where: {
  //         user: {
  //           id: userId,
  //         },
  //       },
  //       relations: {
  //         user: true,
  //       },
  //     });

  //     if (!wallet) {
  //       throw new NotFoundException(
  //         new MessageResponseDto("User wallet not found"),
  //       );
  //     }

  //     if (+wallet.totalCollections < +collectionAmount) {
  //       throw new BadRequestException(
  //         new MessageResponseDto(
  //           `Amount is greater than Total Collections amount: ${wallet.totalCollections}`,
  //         ),
  //       );
  //     }

  //     const {
  //       totalServiceChange,
  //       netPayableAmount: collectionAfterPayinDeduction,
  //     } = getCommissions({
  //       amount: +collectionAmount,
  //       commissionInPercentage: +wallet.user.commissionInPercentagePayin, // PAYIN Commission
  //       gstInPercentage: +wallet.user.gstInPercentagePayin,
  //     });

  //     const newWallet = this.walletRepository.create({
  //       id: wallet.id,
  //       totalCollections: +wallet.totalCollections - +collectionAmount,
  //     });

  //     await queryRunner.manager.save(newWallet);

  //     const settlement = this.settlementsRepository.create({
  //       collectionAmount: +collectionAmount,
  //       serviceCharge: totalServiceChange,
  //       amountAfterDeduction: collectionAfterPayinDeduction,
  //       settlementType: SETTLEMENT_TYPE.MANUAL,
  //       transferMode,
  //       user,
  //       settledBy,
  //       remarks,
  //       bankDetails: targetBank,
  //     });

  //     const savedSettlement = await queryRunner.manager.save(settlement);

  //     this.logger.info(
  //       `SETTLEMENT - initiateSettlements - Sending Settlements Amount: ${collectionAfterPayinDeduction} for Collection Amount: ${collectionAmount} to USER ${user.fullName} (${user.id}) & Bank Details: ${LoggerPlaceHolder.Json}`,
  //       targetBank,
  //     );

  //     const payload: IExternalPayoutRequestFlakPay = {
  //       amount: +collectionAfterPayinDeduction.toFixed(2),
  //       orderId: savedSettlement.id,
  //       transferMode,
  //       beneDetails: {
  //         beneAccountNo: targetBank.accountNumber,
  //         beneBankName: targetBank.bankName,
  //         beneIfsc: targetBank.bankIFSC,
  //         beneName: targetBank.name,
  //       },
  //     };

  //     this.logger.info(
  //       `SETTLEMENT - initiateSettlements - Calling PAYOUT: ${FALKPAY.BASE_URL}${FALKPAY.PAYOUT.LIVE} with payload: ${LoggerPlaceHolder.Json}`,
  //       payload,
  //     );

  //     const externalPayoutResponse =
  //       await axiosServiceFlakPay.postRequest<IExternalPayoutResponseFlakPay>(
  //         FALKPAY.PAYOUT.LIVE,
  //         payload,
  //       );

  //     this.logger.info(
  //       `SETTLEMENT - initiateSettlements - External Payout Response: ${LoggerPlaceHolder.Json}`,
  //       externalPayoutResponse,
  //     );

  //     if (externalPayoutResponse.statusCode !== HttpStatus.OK) {
  //       throw new BadRequestException(
  //         externalPayoutResponse?.message || "Something went wrong",
  //       );
  //     }

  //     const status = convertExternalPaymentStatusToInternal(
  //       externalPayoutResponse.data.status.toUpperCase(),
  //     );

  //     await queryRunner.manager.update(
  //       SettlementsEntity,
  //       { id: savedSettlement.id },
  //       {
  //         transferId: externalPayoutResponse.data.transferId,
  //         utr: externalPayoutResponse.data.utr,
  //         status,
  //       },
  //     );

  //     if (status === PAYMENT_STATUS.FAILED) {
  //       // update wallet
  //       await this.walletRepository.save(
  //         this.walletRepository.create({
  //           id: wallet.id,
  //           totalCollections: +wallet.totalCollections + +collectionAmount,
  //         }),
  //       );
  //     }

  //     await queryRunner.commitTransaction();

  //     // await this.sendSettlementInvoice(savedSettlement.id, "Initiated");
  //     if (status === PAYMENT_STATUS.SUCCESS) {
  //       // await this.sendSettlementInvoice(savedSettlement.id, "Completed");
  //     }

  //     return {
  //       orderId: savedSettlement.id,
  //       collectionAmount: savedSettlement.collectionAmount,
  //       serviceCharge: savedSettlement.serviceCharge,
  //       amountAfterDeduction: savedSettlement.amountAfterDeduction,
  //       transferId: externalPayoutResponse.data.transferId,
  //       utr: externalPayoutResponse.data.utr,
  //       status,
  //     };
  //   } catch (err) {
  //     this.logger.error(
  //       `SETTLEMENT - initiateSettlements - error: ${LoggerPlaceHolder.Json}`,
  //       err,
  //     );
  //     await queryRunner.rollbackTransaction();

  //     throw new BadRequestException(err.message);
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  async initiateSettlementEritech(
    {
      amount: collectionAmount,
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

    // const { clientId, clientSecret } = externalPaymentConfig.flakPay;

    // const axiosServiceFlakPay = new AxiosService(
    //   FALKPAY.BASE_URL,
    //   getFlakPayPgConfig({
    //     clientId,
    //     clientSecret,
    //   }),
    // );

    const token = await this.thirdPartyAuthService.getEritechToken();

    const axiosErtech = new AxiosService(
      ERTITECH.BASE_URL,
      getEritechPgConfig({
        token,
        merchantId: externalPaymentConfig.ertech.merchantId,
      }),
    );

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

      if (+wallet.totalCollections < +collectionAmount) {
        throw new BadRequestException(
          new MessageResponseDto(
            `Amount is greater than Total Collections amount: ${wallet.totalCollections}`,
          ),
        );
      }

      const {
        totalServiceChange,
        netPayableAmount: collectionAfterPayinDeduction,
      } = getPayoutCommissions({
        amount: +collectionAmount,
        commissionInPercentage: +wallet.user.commissionInPercentagePayin, // PAYIN Commission
        gstInPercentage: +wallet.user.gstInPercentagePayin,
      });

      const newWallet = this.walletRepository.create({
        id: wallet.id,
        totalCollections: +wallet.totalCollections - +collectionAmount,
      });

      await queryRunner.manager.save(newWallet);

      const settlement = this.settlementsRepository.create({
        collectionAmount: +collectionAmount,
        serviceCharge: totalServiceChange,
        amountAfterDeduction: collectionAfterPayinDeduction,
        settlementType: SETTLEMENT_TYPE.MANUAL,
        transferMode,
        user,
        settledBy,
        remarks,
        bankDetails: targetBank,
      });

      const savedSettlement = await queryRunner.manager.save(settlement);

      this.logger.info(
        `SETTLEMENT - initiateSettlements - Sending Settlements Amount: ${collectionAfterPayinDeduction} for Collection Amount: ${collectionAmount} to USER ${user.fullName} (${user.id}) & Bank Details: ${LoggerPlaceHolder.Json}`,
        targetBank,
      );

      // const payload: IExternalPayoutRequestEritech = {
      //   orderId: savedSettlement.id,
      //   transferMode,
      //   beneDetails: {
      //     beneAccountNo: targetBank.accountNumber,
      //     beneBankName: targetBank.bankName,
      //     beneIfsc: targetBank.bankIFSC,
      //     beneName: targetBank.name,
      //   },
      // };

      // this.logger.info(
      //   `SETTLEMENT - initiateSettlements - Calling PAYOUT: ${FALKPAY.BASE_URL}${FALKPAY.PAYOUT.LIVE} with payload: ${LoggerPlaceHolder.Json}`,
      //   payload,
      // );

      const ertechPayload = {
        paymentDetails: {
          txnPaymode: transferMode,
          txnAmount: +collectionAfterPayinDeduction.toFixed(2),
          beneIfscCode: targetBank.bankIFSC,
          beneAccNum: targetBank.accountNumber,
          beneName: targetBank.name,
          custUniqRef: savedSettlement.id.split("_").join(""),
          beneMobileNo: user.mobile,
          preferredBank: "ind",
        },
      };

      this.logger.info(
        `Eritech settlement before encryption Payload: ${LoggerPlaceHolder.Json}`,
        ertechPayload,
      );

      const encryptedPayload =
        await this.thirdPartyAuthService.getEncryptedPayload(
          ertechPayload,
          token,
        );

      this.logger.info(
        `Eritech settlement Payload: ${LoggerPlaceHolder.Json}`,
        encryptedPayload,
      );

      const ertechSettlementResponse =
        await axiosErtech.postRequest<IExternalEritecPayoutFundResponse>(
          ERTITECH.PAYOUT.FUND,
          encryptedPayload,
        );

      this.logger.info(
        `SETTLEMENT - initiateSettlements - External Payout Response: ${LoggerPlaceHolder.Json}`,
        ertechSettlementResponse,
      );

      if (!ertechSettlementResponse.success) {
        throw new Error(ertechSettlementResponse.message);
      }

      const ertechDecryptedResponse =
        await this.thirdPartyAuthService.getDecryptedPayload(
          ertechSettlementResponse.data.encryptedResponseData,
          token,
        );

      this.logger.info(
        `Ertitech Response: ${LoggerPlaceHolder.Json}`,
        ertechDecryptedResponse,
      );

      const status = convertExternalPaymentStatusToInternal(
        ertechDecryptedResponse.txn_status.transactionStatus.toUpperCase(),
      );

      await queryRunner.manager.update(
        SettlementsEntity,
        { id: savedSettlement.id },
        {
          transferId: ertechDecryptedResponse.custUniqRef,
          utr: ertechDecryptedResponse.utrNo,
          status,
        },
      );

      if (status === PAYMENT_STATUS.FAILED) {
        // update wallet
        await this.walletRepository.save(
          this.walletRepository.create({
            id: wallet.id,
            totalCollections: +wallet.totalCollections + +collectionAmount,
          }),
        );
      }

      await queryRunner.commitTransaction();

      // await this.sendSettlementInvoice(savedSettlement.id, "Initiated");
      if (status === PAYMENT_STATUS.SUCCESS) {
        // await this.sendSettlementInvoice(savedSettlement.id, "Completed");
      }

      return {
        orderId: savedSettlement.id,
        collectionAmount: savedSettlement.collectionAmount,
        serviceCharge: savedSettlement.serviceCharge,
        amountAfterDeduction: savedSettlement.amountAfterDeduction,
        transferId: ertechDecryptedResponse.custUniqRef,
        utr: ertechDecryptedResponse.utrNo,
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

  async initiateSettlementBuckBox(
    {
      amount: collectionAmount,
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

    const axiosServiceBuckBox = new AxiosService(BUCKBOX.BASE_URL, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${externalPaymentConfig.buckbox.apiToken}`,
        "Api-Key": externalPaymentConfig.buckbox.apiKey,
      },
    });

    // if (!user.address) {
    //   throw new NotFoundException(
    //     new MessageResponseDto("User address not found"),
    //   );
    // }

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

      if (+wallet.totalCollections < +collectionAmount) {
        throw new BadRequestException(
          new MessageResponseDto(
            `Amount is greater than Total Collections amount: ${wallet.totalCollections}`,
          ),
        );
      }

      const {
        totalServiceChange,
        netPayableAmount: collectionAfterPayinDeduction,
      } = getPayoutCommissions({
        amount: +collectionAmount,
        commissionInPercentage: +wallet.user.commissionInPercentagePayin, // PAYIN Commission
        gstInPercentage: +wallet.user.gstInPercentagePayin,
      });

      const newWallet = this.walletRepository.create({
        id: wallet.id,
        totalCollections: +wallet.totalCollections - +collectionAmount,
      });

      await queryRunner.manager.save(newWallet);

      const settlement = this.settlementsRepository.create({
        collectionAmount: +collectionAmount,
        serviceCharge: totalServiceChange,
        amountAfterDeduction: collectionAfterPayinDeduction,
        settlementType: SETTLEMENT_TYPE.MANUAL,
        transferMode,
        user,
        settledBy,
        remarks,
        bankDetails: targetBank,
      });

      const savedSettlement = await queryRunner.manager.save(settlement);

      this.logger.info(
        `SETTLEMENT - initiateSettlements - Sending Settlements Amount: ${collectionAfterPayinDeduction} for Collection Amount: ${collectionAmount} to USER ${user.fullName} (${user.id}) & Bank Details: ${LoggerPlaceHolder.Json}`,
        targetBank,
      );

      const buckboxPayload = {
        product_id: "RU4HJHIE",
        external_order_id: savedSettlement.id,
        amount: collectionAmount,
        payment_mode: "IMPS",
        bene_name: targetBank.name,
        bene_account_number: targetBank.accountNumber,
        bene_mobile: user.mobile,
        bene_ifsc: targetBank.bankIFSC,
        purpose: remarks,
        bank_name: targetBank.bankName,
        branch_name: "Mumbai",
        bene_address: "Mumbai",
      };

      this.logger.info("hiiiiiiiii");

      const buckboxSettlementResponse =
        await axiosServiceBuckBox.postRequest<IExternalBuckboxPayoutFundResponse>(
          BUCKBOX.PAYOUT.LIVE,
          buckboxPayload,
        );

      this.logger.info(
        `SETTLEMENT - initiateSettlements - External Payout Response: ${LoggerPlaceHolder.Json}`,
        buckboxSettlementResponse,
      );

      if (!buckboxSettlementResponse) {
        this.logger.error(
          `Buck Box API error ${LoggerPlaceHolder.Json}`,
          buckboxSettlementResponse,
        );
        throw new Error("Something went wrong");
      }

      const status = convertExternalPaymentStatusToInternal(
        buckboxSettlementResponse.data.status.toUpperCase(),
      );

      await queryRunner.manager.update(
        SettlementsEntity,
        { id: savedSettlement.id },
        {
          transferId: buckboxSettlementResponse.data.transaction_id,
          // utr: ertechDecryptedResponse.utrNo,
          status,
        },
      );

      if (status === PAYMENT_STATUS.FAILED) {
        // update wallet
        await this.walletRepository.save(
          this.walletRepository.create({
            id: wallet.id,
            totalCollections: +wallet.totalCollections + +collectionAmount,
          }),
        );
      }

      await queryRunner.commitTransaction();

      // await this.sendSettlementInvoice(savedSettlement.id, "Initiated");
      if (status === PAYMENT_STATUS.SUCCESS) {
        // await this.sendSettlementInvoice(savedSettlement.id, "Completed");
      }

      return {
        orderId: savedSettlement.id,
        collectionAmount: savedSettlement.collectionAmount,
        serviceCharge: savedSettlement.serviceCharge,
        amountAfterDeduction: savedSettlement.amountAfterDeduction,
        transferId: buckboxSettlementResponse.data.transaction_id,
        // utr: ertechDecryptedResponse.utrNo,
        status,
      };
    } catch (err) {
      this.logger.error(
        `SETTLEMENT - initiateSettlements - error: ${LoggerPlaceHolder.Json}`,
        err.message,
      );
      await queryRunner.rollbackTransaction();

      throw new BadRequestException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async externalWebhookPayoutBuckBox(
    webhookData: any,
  ): Promise<MessageResponseDto> {
    this.logger.info(
      `Buckbox Webhook Data: ${LoggerPlaceHolder.Json}`,
      webhookData,
    );

    const { id, payment_status, utr_number, external_order_id } = webhookData;

    const internalStatus = convertExternalPaymentStatusToInternal(
      payment_status.toUpperCase(),
    );
    const settlementOrder = await this.settlementsRepository.findOne({
      where: {
        id: external_order_id,
      },
      relations: ["user"],
    });

    this.logger.info(
      `PAYOUT WEBHOOK - For OrderId: ${external_order_id} :`,
      settlementOrder,
    );

    if (!settlementOrder) {
      throw new NotFoundException(
        new MessageResponseDto("Payout order not found"),
      );
    }

    if (settlementOrder.status === internalStatus) {
      return new MessageResponseDto(
        `Duplicate Webhook for PAYOUT/SETTLEMENT : ${external_order_id}`,
      );
    }

    if (internalStatus === PAYMENT_STATUS.SUCCESS) {
      const payOutOrderRaw = this.settlementsRepository.create({
        id: settlementOrder.id,
        status: internalStatus,
        successAt: new Date(),
        transferId: id,
        utr: utr_number,
      });

      this.logger.info(
        `PAYOUT - Buckbox Webhook - ${settlementOrder.id} - Webhook received successfully: ${LoggerPlaceHolder.Json}`,
        payOutOrderRaw,
      );

      await this.settlementsRepository.save(payOutOrderRaw);
    }

    if (internalStatus === PAYMENT_STATUS.FAILED) {
      const payOutOrderRaw = this.settlementsRepository.create({
        id: settlementOrder.id,
        status: internalStatus,
        failureAt: new Date(),
        transferId: id,
        utr: utr_number,
      });

      await this.settlementsRepository.save(payOutOrderRaw);

      const wallet = await this.walletRepository.findOne({
        where: {
          user: {
            id: settlementOrder.user.id,
          },
        },
        relations: {
          user: true,
        },
      });

      if (wallet) {
        await this.walletRepository.save(
          this.walletRepository.create({
            id: wallet.id,
            availablePayoutBalance:
              +wallet.availablePayoutBalance +
              +settlementOrder.collectionAmount,
          }),
        );
      }
    }

    return new MessageResponseDto("Payout status updated successfully.");
  }

  async getPendingSettlements({
    limit = 10,
    page = 1,
    search = "",
  }: PaginationWithDateDto) {
    const [settlements, totalItems] = await this.usersRepository.findAndCount({
      where: {
        role: USERS_ROLE.MERCHANT,
        onboardingStatus: ONBOARDING_STATUS.KYC_VERIFIED,
        accountStatus: ACCOUNT_STATUS.ACTIVE,
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
          totalCollections: +settlement.wallet.totalCollections,
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
      totalCollections: +settlement.wallet.totalCollections,
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
        collectionAmount: true,
        serviceCharge: true,
        amountAfterDeduction: true,
        settlementType: true,
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

  async checkSettlementStatus(settlementId: string) {
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
        collectionAmount: settlement.collectionAmount,
        serviceCharge: settlement.serviceCharge,
        amount: settlement.amountAfterDeduction,
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
      amount: settlement.amountAfterDeduction,
    };
  }
  // async checkSettlementStatusPayNPro(settlementId: string) {
  //   const settlement = await this.settlementsRepository.findOne({
  //     where: {
  //       id: settlementId,
  //     },
  //   });

  //   if (!settlement) {
  //     throw new NotFoundException(
  //       new MessageResponseDto("No Settlement Found"),
  //     );
  //   }

  //   if (settlement.status === PAYMENT_STATUS.SUCCESS) {
  //     return {
  //       settlementId,
  //       status: settlement.status,
  //       amount: settlement.amount,
  //     };
  //   }

  //   // call third party api
  //   const payload: IExternalPayoutStatusRequestPayNPro = {
  //     payout_ref: settlementId,
  //     signature: payoutSignature,
  //   };
  //   const response =
  //     await this.axiosService.postRequest<IExternalPayoutStatusResponsePayNPro>(
  //       PAYNPRO.PAYOUT.STATUS,
  //       payload,
  //     );

  //   if (response.statusCode?.toString() !== "200") {
  //     throw new BadRequestException(
  //       new MessageResponseDto(response?.error || "Something went wrong!"),
  //     );
  //   }

  //   const status = convertExternalPaymentStatusToInternal(
  //     response.data?.[0]?.status?.toUpperCase(),
  //   );

  //   const settlementRaw = this.settlementsRepository.create({
  //     id: settlement.id,
  //     status,
  //     ...(status === PAYMENT_STATUS.SUCCESS && {
  //       successAt: new Date(),
  //     }),
  //     ...(status === PAYMENT_STATUS.FAILED && {
  //       failureAt: new Date(),
  //     }),
  //   });

  //   await this.settlementsRepository.save(settlementRaw);

  //   return {
  //     settlementId,
  //     status,
  //     amount: settlement.amount,
  //   };
  // }
}
