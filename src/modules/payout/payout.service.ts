import {
  Between,
  Brackets,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from "typeorm";
import axios from "axios";
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import {
  DateDto,
  MessageResponseDto,
  PaginationWithDateDto,
  PaginationWithoutSortAndOrderDto,
} from "@/dtos/common.dto";
import { todayEndDate, todayStartDate } from "@/utils/date.utils";
import { getPagination } from "@/utils/pagination.utils";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { UsersEntity } from "@/entities/user.entity";
import { ACCOUNT_STATUS, ONBOARDING_STATUS, USERS_ROLE } from "@/enums";
import { FALKPAY, ISMART_PAY } from "@/constants/external-api.constant";
import {
  getFlakPayPgConfig,
  getIsmartPayPgConfig,
} from "@/utils/pg-config.utils";
import { AxiosService } from "@/shared/axios/axios.service";
import { appConfig } from "@/config/app.config";
import {
  IExternalPayoutStatusResponseFlakPay,
  IExternalPayoutStatusResponseIsmart,
} from "@/interface/external-api.interface";
import {
  PayoutStatusDto,
  PayoutStatusMerchantDto,
} from "@/modules/payments/dto/create-payout-payment.dto";
import { convertExternalPaymentStatusToInternal } from "@/utils/helperFunctions.utils";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";
import { ApiCredentialsEntity } from "@/entities/api-credentials.entity";
import { decryptData } from "@/utils/encode-decode.utils";

const { externalPaymentConfig } = appConfig();

@Injectable()
export class PayoutService {
  private readonly logger = new CustomLogger(PayoutService.name);
  constructor(
    @InjectRepository(PayOutOrdersEntity)
    private readonly payoutRepository: Repository<PayOutOrdersEntity>,
    @InjectRepository(UsersEntity)
    private readonly userRepository: Repository<UsersEntity>,
    @InjectRepository(ApiCredentialsEntity)
    private readonly apiCredentialsRepository: Repository<ApiCredentialsEntity>,
  ) {}

  async getAllPayoutsGroupedByUser({
    page = 1,
    limit = 10,

    search = "",
  }: PaginationWithoutSortAndOrderDto) {
    const query = this.userRepository
      .createQueryBuilder("user")
      .where(
        new Brackets((qb) => {
          qb.where("user.fullName ILIKE :search", {
            search: `%${search}%`,
          }).orWhere("user.email ILIKE :search", { search: `%${search}%` });
        }),
      )
      .andWhere("user.role = :role", { role: USERS_ROLE.MERCHANT })
      .andWhere("user.onboardingStatus = :onboardingStatus", {
        onboardingStatus: ONBOARDING_STATUS.KYC_VERIFIED,
      })
      .andWhere("user.accountStatus NOT IN (:...statuses)", {
        statuses: [
          ACCOUNT_STATUS.INTERNAL_USER,
          ACCOUNT_STATUS.TEST_DELETED,
          ACCOUNT_STATUS.DELETED,
        ],
      })
      .leftJoin("user.payOutOrders", "payout")
      .select([
        "user.id",

        // Total initiated amount
        'COALESCE(SUM(payout.amount), 0) as "initiatedTotalAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :successStatus THEN payout.amount ELSE 0.00 END), 0) as "successTotalAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :failedStatus THEN payout.amount ELSE 0.00 END), 0) as "failedTotalAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :pendingStatus THEN payout.amount ELSE 0.00 END), 0) as "pendingTotalAmount"',

        // Total Net Payable amount
        'COALESCE(SUM(payout.amountBeforeDeduction), 0) as "initiatedNetPayableAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :successStatus THEN payout.amountBeforeDeduction ELSE 0.00 END), 0) as "successNetPayableAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :failedStatus THEN payout.amountBeforeDeduction ELSE 0.00 END), 0) as "failedNetPayableAmount"',
        'COALESCE(SUM(CASE WHEN payout.status = :pendingStatus THEN payout.amountBeforeDeduction ELSE 0.00 END), 0) as "pendingNetPayableAmount"',

        // count: total initiated payout
        'COUNT(payout.id) as "initiatedTotalCount"',
        'COUNT(CASE WHEN payout.status = :successStatus THEN payout.id ELSE NULL END) as "successCount"',
        'COUNT(CASE WHEN payout.status = :failedStatus THEN payout.id ELSE NULL END) as "failedCount"',
        'COUNT(CASE WHEN payout.status = :pendingStatus THEN payout.id ELSE NULL END) as "pendingCount"',
      ])
      .groupBy("user.id")
      .addSelect("user.id", "id")
      .addSelect("user.fullName", "fullName")
      .addSelect("user.email", "email")
      .setParameter("successStatus", PAYMENT_STATUS.SUCCESS)
      .setParameter("failedStatus", PAYMENT_STATUS.FAILED)
      .setParameter("pendingStatus", PAYMENT_STATUS.PENDING);

    const { raw: data } = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getRawAndEntities();

    const totalItems = await query.getCount();

    const pagination = getPagination({
      page,
      limit,
      totalItems,
    });

    return {
      data,
      pagination,
    };
  }

  async getAllPayoutsAdmin({
    page = 1,
    limit = 10,
    sort = "id",
    order = "DESC",
    search = "",
    startDate = todayStartDate(),
    endDate = todayEndDate(),
  }: PaginationWithDateDto) {
    const whereQuery:
      | FindOptionsWhere<PayOutOrdersEntity>
      | FindOptionsWhere<PayOutOrdersEntity>[] = {};

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
        orderId: ILike(`%${search}%`),
      });
      query.push({
        user: {
          fullName: ILike(`%${search}%`),
        },
      });
      query.push({
        user: {
          email: ILike(`%${search}%`),
        },
      });
    }

    const [data, totalItems] = await this.payoutRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        [sort]: order,
      },
      where: query,
      relations: {
        user: true,
      },
      select: {
        user: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        orderId: true,
        amount: true,
        status: true,
        createdAt: true,
        transferId: true,
        transferMode: true,
      },
    });

    const pagination = getPagination({ totalItems, page, limit });

    return {
      data,
      pagination,
    };
  }

  async getAllPayoutsMerchant(
    {
      page = 1,
      limit = 10,
      sort = "id",
      order = "DESC",
      search = "",
      startDate = todayStartDate(),
      endDate = todayEndDate(),
    }: PaginationWithDateDto,
    userId: string,
  ) {
    const whereQuery:
      | FindOptionsWhere<PayOutOrdersEntity>
      | FindOptionsWhere<PayOutOrdersEntity>[] = {};

    // Date Filter
    if (startDate && endDate) {
      whereQuery.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      whereQuery.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      whereQuery.createdAt = LessThanOrEqual(new Date(endDate));
    }

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    const query = [];

    if (search) {
      query.push({
        orderId: ILike(`%${search}%`),
        user: {
          id: userId,
        },
      });
      query.push({
        transferId: ILike(`%${search}%`),
        user: {
          id: userId,
        },
      });
    } else {
      query.push({
        ...whereQuery,
        user: {
          id: userId,
        },
      });
    }

    const [payouts, totalItems] = await this.payoutRepository.findAndCount({
      where: query,
      relations: {
        user: true,
      },
      select: {
        id: true,
        amount: true,
        amountBeforeDeduction: true,
        commissionInPercentage: true,
        gstInPercentage: true,
        status: true,
        transferId: true,
        orderId: true,
        payoutId: true,
        transferMode: true,
        utr: true,
        batchId: true,
        createdAt: true,
        user: {
          id: true,
          fullName: true,
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      order: { [sort]: order },
    });

    const pagination = getPagination({
      page,
      limit,
      totalItems,
    });

    if ([USERS_ROLE.ADMIN, USERS_ROLE.OWNER].includes(user.role)) {
      return {
        data: payouts,
        pagination,
      };
    } else {
      const { todayPayouts, todaySuccess, todayFailed } =
        await this.calculateStats(userId, {
          startDate,
          endDate,
        });

      return {
        data: payouts,
        pagination,
        stats: {
          totalPayouts: +todayPayouts,
          totalSuccess: +todaySuccess,
          totalFailed: +todayFailed,
        },
      };
    }
  }

  async calculateStats(
    userId: string,
    { startDate = todayStartDate(), endDate = todayEndDate() }: DateDto,
  ) {
    const todayPayoutsPromise = this.payoutRepository.sum("amount", {
      createdAt: Between(new Date(startDate), new Date(endDate)),
      user: { id: userId },
    });

    const todaySuccessPromise = this.payoutRepository.sum("amount", {
      createdAt: Between(new Date(startDate), new Date(endDate)),
      status: PAYMENT_STATUS.SUCCESS,
      user: { id: userId },
    });

    const todayFailedPromise = this.payoutRepository.sum("amount", {
      createdAt: Between(new Date(startDate), new Date(endDate)),
      status: PAYMENT_STATUS.FAILED,
      user: { id: userId },
    });

    const [todayPayouts, todaySuccess, todayFailed] = await Promise.all([
      todayPayoutsPromise,
      todaySuccessPromise,
      todayFailedPromise,
    ]);

    return {
      todayPayouts: +todayPayouts,
      todaySuccess: +todaySuccess,
      todayFailed: +todayFailed,
    };
  }

  async getPayoutById(payoutId: string) {
    const payout = await this.payoutRepository.findOne({
      where: { id: payoutId },
      relations: {
        user: true,
      },
      select: {
        user: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        id: true,
        orderId: true,
        amount: true,
        status: true,
        transferId: true,
        transferMode: true,
        batchId: true,
        createdAt: true,
      },
    });

    if (!payout) {
      throw new NotFoundException(new MessageResponseDto("Payout not found"));
    }

    return payout;
  }

  async getPayoutByOrderId(orderId: string) {
    const payout = await this.payoutRepository.findOne({
      where: { orderId },
      relations: {
        user: true,
      },
      select: {
        id: true,
        orderId: true,
        amount: true,
        status: true,
        transferId: true,
        transferMode: true,
        batchId: true,
        bankName: true,
        bankAccountNumber: true,
        bankIfsc: true,
        successAt: true,
        createdAt: true,
        name: true,
        payoutId: true,
        purpose: true,
        remarks: true,
        utr: true,
        user: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    });

    if (!payout) {
      throw new NotFoundException(new MessageResponseDto("Payout not found"));
    }

    return payout;
  }

  async checkPayOutStatusTransactionFlakPay(
    { payoutId }: PayoutStatusMerchantDto,
    user: UsersEntity,
  ) {
    const payoutOrder = await this.payoutRepository.findOne({
      where: { payoutId },
    });

    if (!payoutOrder) {
      throw new NotFoundException(
        new MessageResponseDto("Payout order not found"),
      );
    }

    if (payoutOrder.status !== PAYMENT_STATUS.PENDING) {
      return {
        orderId: payoutOrder.orderId,
        status: payoutOrder.status,
        transferId: payoutOrder.transferId,
        payoutId: payoutOrder.payoutId,
        utr: payoutOrder.utr,
      };
    }

    // call api

    const { clientId, clientSecret } = await this.getFlakPayCredentials(
      user.id,
    );

    const axiosServiceFlakPay = new AxiosService(
      FALKPAY.BASE_URL,
      getFlakPayPgConfig({
        clientId,
        clientSecret,
      }),
    );

    const flakPayResponse =
      await axiosServiceFlakPay.postRequest<IExternalPayoutStatusResponseFlakPay>(
        FALKPAY.PAYOUT.STATUS_CHECK,
        {
          orderId: payoutOrder.orderId,
        },
      );

    if (flakPayResponse.statusCode !== HttpStatus.OK) {
      throw new BadRequestException(
        new MessageResponseDto(flakPayResponse.message),
      );
    }

    // update payout order

    const status = convertExternalPaymentStatusToInternal(
      flakPayResponse.data.status.toUpperCase(),
    );

    const savedPayout = await this.payoutRepository.save(
      this.payoutRepository.create({
        ...payoutOrder,
        status,
        transferId: flakPayResponse.data.transferId,
      }),
    );

    if (user?.payOutWebhookUrl) {
      const payload = {
        orderId: savedPayout.orderId,
        status,
        amount: +savedPayout.amount,
        txnRefId: savedPayout.transferId,
        utr: savedPayout.utr,
      };
      this.logger.info(
        `Payout webhook for ${savedPayout.orderId} PAYLOAD : ${LoggerPlaceHolder.Json}`,
        payload,
      );
      axios
        .post(user.payOutWebhookUrl, payload)
        .then((res) => {
          this.logger.info(
            `Payout webhook sent successfully: ${savedPayout.orderId} : ${LoggerPlaceHolder.Json}`,
            res,
          );
        })
        .catch((error) => {
          this.logger.error(
            `Payout webhook failed for order: ${savedPayout.orderId} : ${LoggerPlaceHolder.Json}`,
            error,
          );
        });
    }

    return {
      orderId: payoutOrder.orderId,
      status,
      transferId: flakPayResponse.data.transferId,
    };
  }

  async checkPayOutStatusDashboardFlakPay(
    { orderId }: PayoutStatusDto,
    user: UsersEntity,
  ) {
    const payoutOrder = await this.payoutRepository.findOne({
      where: { orderId },
    });

    if (!payoutOrder) {
      throw new NotFoundException(
        new MessageResponseDto("Payout order not found"),
      );
    }

    if (payoutOrder.status !== PAYMENT_STATUS.PENDING) {
      return {
        orderId: payoutOrder.orderId,
        status: payoutOrder.status,
        transferId: payoutOrder.transferId,
        payoutId: payoutOrder.payoutId,
      };
    }

    // call api

    const { clientId, clientSecret } = await this.getFlakPayCredentials(
      user.id,
    );

    const axiosServiceFlakPay = new AxiosService(
      FALKPAY.BASE_URL,
      getFlakPayPgConfig({
        clientId,
        clientSecret,
      }),
    );

    const flakPayResponse =
      await axiosServiceFlakPay.postRequest<IExternalPayoutStatusResponseFlakPay>(
        FALKPAY.PAYOUT.STATUS_CHECK,
        {
          orderId,
        },
      );

    if (flakPayResponse.statusCode !== HttpStatus.OK) {
      throw new BadRequestException(
        new MessageResponseDto(flakPayResponse.message),
      );
    }

    // update payout order

    const status = convertExternalPaymentStatusToInternal(
      flakPayResponse.data.status.toUpperCase(),
    );

    const savedPayout = await this.payoutRepository.save(
      this.payoutRepository.create({
        ...payoutOrder,
        status,
        transferId: flakPayResponse.data.transferId,
      }),
    );

    if (user?.payOutWebhookUrl) {
      const payload = {
        orderId: savedPayout.orderId,
        status,
        amount: +savedPayout.amount,
        txnRefId: savedPayout.transferId,
      };
      this.logger.info(
        `Payout webhook for ${savedPayout.orderId} PAYLOAD : ${LoggerPlaceHolder.Json}`,
        payload,
      );
      axios
        .post(user.payOutWebhookUrl, payload)
        .then(({ data }) => {
          this.logger.info(
            `Payout webhook sent successfully: ${savedPayout.orderId} RES : ${JSON.stringify(data)}`,
          );
        })
        .catch((error) => {
          this.logger.error(
            `Payout webhook failed for order: ${savedPayout.orderId} : ${LoggerPlaceHolder.Json}`,
            error,
          );
        });
    }

    return {
      orderId: payoutOrder.orderId,
      status,
      transferId: flakPayResponse.data.transferId,
    };
  }

  async checkPayOutStatusTransactionIsmart({ orderId }: PayoutStatusDto) {
    const payoutOrder = await this.payoutRepository.findOne({
      where: { orderId },
      relations: {
        user: true,
      },
    });

    if (!payoutOrder) {
      throw new NotFoundException(
        new MessageResponseDto("Payout order not found"),
      );
    }

    if (payoutOrder.status !== PAYMENT_STATUS.PENDING) {
      return {
        orderId: payoutOrder.orderId,
        status: payoutOrder.status,
        transferId: payoutOrder.transferId,
      };
    }

    // call api

    const axiosServiceIsmart = new AxiosService(
      ISMART_PAY.BASE_URL,
      getIsmartPayPgConfig({
        clientId: externalPaymentConfig.ismart.clientId,
        clientSecret: externalPaymentConfig.ismart.clientSecret,
      }),
    );

    const ismartPayResponse =
      await axiosServiceIsmart.getRequest<IExternalPayoutStatusResponseIsmart>(
        `${ISMART_PAY.PAYOUT_STATUS}/${payoutOrder.transferId}`,
      );

    if (!ismartPayResponse.status) {
      throw new BadRequestException(
        new MessageResponseDto(ismartPayResponse.message),
      );
    }

    // update payout order

    const status = convertExternalPaymentStatusToInternal(
      ismartPayResponse.status_code.toUpperCase(),
    );

    await this.payoutRepository.save(
      this.payoutRepository.create({
        ...payoutOrder,
        status,
        transferId: ismartPayResponse.transaction_id,
      }),
    );

    if (status !== payoutOrder.status) {
      // send callback
      const payoutCallbackUrl = payoutOrder.user.payOutWebhookUrl;

      if (payoutCallbackUrl) {
        axios
          .post(payoutCallbackUrl, {
            orderId: payoutOrder.orderId,
            status,
            amount: payoutOrder.amount,
            txnRefId: ismartPayResponse.transaction_id,
          })
          .then((res) => {
            this.logger.info(
              `PAYOUT - User webhook (${payoutOrder.user.payOutWebhookUrl}) sent successfully: ${LoggerPlaceHolder.Json}`,
              {
                orderId: payoutOrder.orderId,
                status,
                amount: payoutOrder.amount,
                txnRefId: ismartPayResponse.transaction_id,
              },
            );
            this.logger.info(
              `PAYOUT - externalPayinWebhookUpdateStatus - webhook response: ${LoggerPlaceHolder.Json}`,
              res.data,
            );
          })
          .catch((err) => {
            this.logger.error(
              `PAYOUT - externalPayinWebhookUpdateStatus - error while sending webhook to user: ${LoggerPlaceHolder.Json}`,
              err,
            );
          });
      }
    }

    return {
      orderId: payoutOrder.orderId,
      status,
      transferId: ismartPayResponse.transaction_id,
    };
  }

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
}
