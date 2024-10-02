import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, ILike, Repository } from "typeorm";
import { InitiateSettlementAdminDto } from "./dto/initate-settlement-admin.dto";
import { MessageResponseDto, PaginationDto } from "@/dtos/common.dto";
import {
  PAYMENT_STATUS,
  PAYMENT_TYPE,
  SETTLEMENT_STATUS,
} from "@/enums/payment.enum";
import { UsersEntity } from "@/entities/user.entity";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";
import { PayoutBatchesEntity } from "@/entities/payout-batch.entity";
import {
  convertExternalPaymentStatusToInternal,
  getUlidId,
} from "@/utils/helperFunctions.utils";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { AxiosService } from "@/shared/axios/axios.service";
import { appConfig } from "@/config/app.config";
import { IExternalPayoutPaymentResponse } from "@/interface/external-api.interface";
import { getPagination } from "@/utils/pagination.utils";

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
    @InjectRepository(PayInOrdersEntity)
    private readonly payInOrdersRepository: Repository<PayInOrdersEntity>,
    @InjectRepository(PayoutBatchesEntity)
    private readonly payoutBatchesRepository: Repository<PayoutBatchesEntity>,
    @InjectRepository(TransactionsEntity)
    private readonly transactionsRepository: Repository<TransactionsEntity>,

    private readonly dataSource: DataSource,
  ) {}

  async getSettlementsAdmin({
    limit = 10,
    page = 1,
    search = "",
    order = "DESC",
    sort = "id",
  }: PaginationDto) {
    const settlements = await this.usersRepository.find({
      where: [
        {
          fullName: ILike(`%${search}%`),
          payInOrders: {
            status: PAYMENT_STATUS.SUCCESS,
            settlementStatus: SETTLEMENT_STATUS.NOT_INITIATED,
          },
        },
        {
          fullName: ILike(`%${search}%`),
          payInOrders: {
            status: PAYMENT_STATUS.SUCCESS,
            settlementStatus: SETTLEMENT_STATUS.FAILED,
          },
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

  async initiateSettlementAdmin(
    initiateSettlementAdminDto: InitiateSettlementAdminDto,
  ) {
    const { userId } = initiateSettlementAdminDto;

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: {
        bankDetails: true,
        businessDetails: true,
      },
    });

    if (!user.bankDetails) {
      throw new BadRequestException("Please add User's bank details first");
    }

    const { bankDetails } = user;

    const queryRunner = this.dataSource.createQueryRunner();

    // Start transaction
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const orderId = getUlidId("stmnt");

      const [payinOrderList, count] =
        await this.payInOrdersRepository.findAndCount({
          where: [
            {
              status: PAYMENT_STATUS.SUCCESS,
              settlementStatus: SETTLEMENT_STATUS.NOT_INITIATED,
              user: {
                id: userId,
              },
            },
            {
              status: PAYMENT_STATUS.SUCCESS,
              settlementStatus: SETTLEMENT_STATUS.FAILED,
              user: {
                id: userId,
              },
            },
          ],
        });

      if (count <= 0) {
        throw new BadRequestException(
          new MessageResponseDto("No pending payin to settle"),
        );
      }

      const payoutAmount = await this.payInOrdersRepository.sum(
        "netPayableAmount",
        [
          {
            status: PAYMENT_STATUS.SUCCESS,
            settlementStatus: SETTLEMENT_STATUS.NOT_INITIATED,
            user: {
              id: userId,
            },
          },
          {
            status: PAYMENT_STATUS.SUCCESS,
            settlementStatus: SETTLEMENT_STATUS.FAILED,
            user: {
              id: userId,
            },
          },
        ],
      );

      // 1. create payout batch order
      const payoutBatchOrder = this.payoutBatchesRepository.create({
        user,
        orderId,
        amount: payoutAmount,
        industryType: "E-COM",
        transferMode: initiateSettlementAdminDto.transferMode,
      });

      // 2. save payout batch order
      const savedPayoutBatchOrder =
        await queryRunner.manager.save(payoutBatchOrder);

      // 3. create transaction
      const transaction = this.transactionsRepository.create({
        user,
        payoutBatch: savedPayoutBatchOrder,
        transactionType: PAYMENT_TYPE.SETTLEMENT,
      });

      // 4. save transaction
      const savedTransaction = await queryRunner.manager.save(transaction);

      this.logger.info(
        `SETTLEMENT - createTransaction - transaction: ${LoggerPlaceHolder.Json}`,
        savedTransaction,
      );

      // 5. create external payment

      const payload = {
        orderId,
        amount: savedPayoutBatchOrder.netPayableAmount,
        transferMode: initiateSettlementAdminDto.transferMode,
        industryType: payoutBatchOrder.industryType,
        beneDetails: {
          beneBankName: bankDetails.bankName,
          beneAccountNo: bankDetails.accountNumber,
          beneIfsc: bankDetails.bankIFSC,
          beneName: bankDetails.name,
          beneEmail: bankDetails.email,
          benePhone: bankDetails.mobile,
        },
      };
      this.logger.info(
        `SETTLEMENT - calling external (digi-payout/api/v1/external/payout/ft) API with payload: ${LoggerPlaceHolder.Json}`,
        payload,
      );

      const externalPaymentResponse =
        await this.axiosService.postRequest<IExternalPayoutPaymentResponse>(
          "digi-payout/api/v1/external/payout/ft",
          payload,
        );

      this.logger.info(
        `PAYOUT - createTransaction - externalPaymentResponse: ${LoggerPlaceHolder.Json}`,
        externalPaymentResponse,
      );

      // 6. save external payment
      const savedOrder = await queryRunner.manager.save(
        this.payoutBatchesRepository.create({
          ...savedPayoutBatchOrder,
          transferId: externalPaymentResponse.data.transferId,
          status: convertExternalPaymentStatusToInternal(
            externalPaymentResponse.status,
          ),
        }),
      );

      // 7. update pay-in order status
      const updatedPayinList = payinOrderList.map((list) =>
        this.payInOrdersRepository.create({
          ...list,
          settlementStatus: SETTLEMENT_STATUS.INITIATED,
        }),
      );

      await this.payInOrdersRepository.save(updatedPayinList);

      await queryRunner.commitTransaction();

      return {
        orderId,
        transferId: savedOrder.transferId,
        status: convertExternalPaymentStatusToInternal(
          externalPaymentResponse.status,
        ),
      };
    } catch (err: any) {
      this.logger.error(
        `SETTLEMENT - createTransaction - Got error while creating transaction - err: ${LoggerPlaceHolder.Json}`,
        err,
      );
      // Rollback transaction if any operation fails
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err.message);
    } finally {
      // Release the queryRunner to avoid memory leaks
      await queryRunner.release();
    }
  }
}
