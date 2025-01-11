import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PayoutService } from "./payout.service";
import { User } from "@/decorators/user.decorator";
import { UsersEntity } from "@/entities/user.entity";
import {
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

  @ApiOperation({ summary: "Get all payouts by user id - Admin" })
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Get("/admin/:userId")
  async getAllPayoutsByUserId(
    @Param("userId") userId: string,
    @Query() query: PaginationWithDateDto,
  ) {
    return this.payoutService.getAllPayoutsMerchant(query, userId);
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
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Post("status")
  async checkPayoutStatus(@Body() body: PayoutStatusDto) {
    return this.payoutService.checkPayOutStatusTransactionFlakPay(body);
  }

  @ApiOperation({ summary: "Get payout by id" })
  @Get(":payoutId")
  async getPayoutById(@Param("payoutId") payoutId: string) {
    return this.payoutService.getPayoutById(payoutId);
  }
}
