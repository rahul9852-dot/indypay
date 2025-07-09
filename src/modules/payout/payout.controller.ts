import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PayoutService } from "./payout.service";
import { User } from "@/decorators/user.decorator";
import { UsersEntity } from "@/entities/user.entity";
import {
  PaginationWithDateAndStatusDto,
  PaginationWithDateDto,
  PaginationWithoutSortAndOrderDto,
} from "@/dtos/common.dto";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";
import { PayoutStatusDto } from "@/modules/payments/dto/create-payout-payment.dto";

@ApiTags("Payout")
@Controller("payout")
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  @ApiOperation({ summary: "Get all payouts grouped by user - Admin" })
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Get("/admin")
  async getAllPayoutsGroupedByUser(
    @Query() query: PaginationWithoutSortAndOrderDto,
  ) {
    return this.payoutService.getAllPayoutsGroupedByUser(query);
  }

  @ApiOperation({
    summary: "Get all payouts grouped by user - Channel Partner",
  })
  @Role(USERS_ROLE.CHANNEL_PARTNER)
  @Get("/cp")
  async getAllPayoutsGroupedByUserCP(
    @Query() query: PaginationWithoutSortAndOrderDto,
    @User() user: UsersEntity,
  ) {
    return this.payoutService.getAllPayoutsGroupedByUser(query, user.id);
  }

  @ApiOperation({ summary: "Get all payouts by user id - Admin" })
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Get("/admin/:userId")
  async getAllPayoutsByUserId(
    @Param("userId") userId: string,
    @Query() query: PaginationWithDateAndStatusDto,
  ) {
    return this.payoutService.getAllPayoutsMerchant(query, userId);
  }

  @ApiOperation({ summary: "Get all payouts by user id - Channel Partner" })
  @Role(USERS_ROLE.CHANNEL_PARTNER)
  @Get("/cp/:userId")
  async getAllPayoutsByUserIdCP(
    @Param("userId") userId: string,
    @Query() query: PaginationWithDateAndStatusDto,
    @User() user: UsersEntity,
  ) {
    return this.payoutService.getAllPayoutsMerchant(query, userId, user.id);
  }

  @ApiOperation({ summary: "Get all payouts - Merchant" })
  @Role(USERS_ROLE.MERCHANT)
  @Get()
  async getAllPayouts(
    @User() user: UsersEntity,
    @Query() query: PaginationWithDateDto,
  ) {
    return this.payoutService.getAllPayoutsMerchant(query, user.id);
  }

  @ApiOperation({ summary: "Check payout status" })
  @Post("status")
  async checkPayoutStatus(
    @Body() body: PayoutStatusDto,
    @User() user: UsersEntity,
  ) {
    return this.payoutService.checkPayOutStatusDashboardFlakPay(body, user);
  }

  @ApiOperation({ summary: "Get By OrderId" })
  @Get("/order/:orderId")
  @Role(USERS_ROLE.OWNER)
  async getPayoutByOrderId(@Param("orderId") orderId: string) {
    return this.payoutService.getPayoutByOrderId(orderId);
  }

  @ApiOperation({ summary: "Get payout by id" })
  @Get(":payoutId")
  async getPayoutById(@Param("payoutId") payoutId: string) {
    return this.payoutService.getPayoutById(payoutId);
  }
}
