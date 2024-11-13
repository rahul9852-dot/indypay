import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, DataSource, ILike, Repository } from "typeorm";
import * as dayjs from "dayjs";
import { InitiateSettlementAdminDto } from "./dto/initate-settlement-admin.dto";
import { PaginationWithDateDto } from "@/dtos/common.dto";
import { PAYMENT_STATUS, SETTLEMENT_STATUS } from "@/enums/payment.enum";
import { UsersEntity } from "@/entities/user.entity";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";
import { convertExternalPaymentStatusToInternal } from "@/utils/helperFunctions.utils";
import { AxiosService } from "@/shared/axios/axios.service";
import { appConfig } from "@/config/app.config";
import {
  IExternalPayoutResponse,
  IExternalPayoutRequest,
} from "@/interface/external-api.interface";
import { getPagination } from "@/utils/pagination.utils";
import { SettlementsEntity } from "@/entities/settlements.entity";
import { ANVITAPAY } from "@/constants/external-api.constant";

const {
  externalPaymentConfig: { baseUrl, clientId, clientSecret },
} = appConfig();

@Injectable()
export class SettlementsService {
  private readonly logger = new CustomLogger(SettlementsService.name);
  private readonly axiosService = new AxiosService(baseUrl, {
    headers: {
      "Content-Type": "application/json",
      "client-id": clientId,
      "secret-key": clientSecret,
    },
  });

  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(SettlementsEntity)
    private readonly settlementsRepository: Repository<SettlementsEntity>,

    private readonly dataSource: DataSource,
  ) {}

  async getSettlementsAdmin({
    limit = 10,
    page = 1,
    search = "",
    order = "DESC",
    sort = "id",
    startDate = dayjs().startOf("day").toDate(),
    endDate = dayjs().endOf("day").toDate(),
  }: PaginationWithDateDto) {
    const settlements = await this.usersRepository.find({
      where: [
        {
          fullName: ILike(`%${search}%`),
          payInOrders: {
            status: PAYMENT_STATUS.SUCCESS,
            settlementStatus: SETTLEMENT_STATUS.NOT_INITIATED,
          },
          createdAt: Between(new Date(startDate), new Date(endDate)),
        },
        {
          fullName: ILike(`%${search}%`),
          payInOrders: {
            status: PAYMENT_STATUS.SUCCESS,
            settlementStatus: SETTLEMENT_STATUS.FAILED,
          },
          createdAt: Between(new Date(startDate), new Date(endDate)),
        },
      ],
      relations: {
        payInOrders: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobile: true,
        createdAt: true,
        payInOrders: {
          id: true,
          orderId: true,
          netPayableAmount: true,
        },
      },
      take: limit,
      skip: (page - 1) * limit,
      order: {
        [sort]: order,
      },
    });

    const response = settlements
      .map((settlement) => {
        const totalAmount = settlement.payInOrders.reduce(
          (acc, cur) => acc + Number(cur.netPayableAmount),
          0,
        );

        return {
          id: settlement.id,
          fullName: settlement.fullName,
          email: settlement.email,
          mobile: settlement.mobile,
          createdAt: settlement.createdAt,
          totalAmount,
        };
      })
      .filter((stmnt) => stmnt.totalAmount > 0);

    const totalItems = response.length;

    const pagination = getPagination({
      totalItems,
      limit,
      page,
    });

    return {
      data: response,
      pagination,
    };
  }

  // async initiateSettlementAdmin(
  //   initiateSettlementAdminDto: InitiateSettlementAdminDto,
  // ) {
  //   const { userId } = initiateSettlementAdminDto;

  //   const user = await this.usersRepository.findOne({
  //     where: { id: userId },
  //     relations: {
  //       bankDetails: true,
  //       businessDetails: true,
  //       address: true,
  //     },
  //   });

  //   if (!user.bankDetails) {
  //     throw new BadRequestException("Please add User's bank details first");
  //   }

  //   const { bankDetails } = user;

  //   const queryRunner = this.dataSource.createQueryRunner();

  //   // Start transaction
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     const settlement = this.settlementsRepository.create({
  //       amount: +initiateSettlementAdminDto.amount,
  //       transferMode: initiateSettlementAdminDto.transferMode,
  //       user,
  //     });

  //     const savedSettlement = await queryRunner.manager.save(settlement);

  //     this.logger.info(
  //       `SETTLEMENT - Sending Settlements Amount: ${initiateSettlementAdminDto.amount} to USER ${user.fullName} (${user.id}) & Bank Details: ${LoggerPlaceHolder.Json}`,
  //       bankDetails,
  //     );

  //     const payload: IExternalPayoutRequest = {
  //       amount: +initiateSettlementAdminDto.amount,
  //       bene_name: bankDetails.name,
  //       email: bankDetails.email,
  //       mobile: bankDetails.mobile,
  //       account: bankDetails.accountNumber,
  //       ifsc: bankDetails.bankIFSC,
  //       Address: user.address?.[0].address || "",
  //       mode: initiateSettlementAdminDto.transferMode,
  //       ref_no: savedSettlement.id,
  //       Remark: initiateSettlementAdminDto.remarks,
  //     };

  //     this.logger.info(
  //       `SETTLEMENT - Calling PAYOUT: ${baseUrl}/${ANVITAPAY.PAYOUT} with payload: ${LoggerPlaceHolder.Json}`,
  //       payload,
  //     );

  //     const externalPayoutResponse =
  //       await this.axiosService.postRequest<IExternalPayoutResponse>(
  //         ANVITAPAY.PAYOUT,
  //         payload,
  //       );

  //     this.logger.info(
  //       `SETTLEMENT - External Payout Response: ${LoggerPlaceHolder.Json}`,
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
  //   } catch (error) {
  //     this.logger.error(
  //       `SETTLEMENT - initiateSettlementAdmin - error: ${LoggerPlaceHolder.Json}`,
  //       error,
  //     );
  //     await queryRunner.rollbackTransaction();
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }
}
