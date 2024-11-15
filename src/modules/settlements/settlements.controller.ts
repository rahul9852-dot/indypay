import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SettlementsService } from "./settlements.service";
import { InitiateSettlementAdminDto } from "./dto/initate-settlement-admin.dto";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";
import {
  PaginationWithDateDto,
  PaginationWithoutSortAndOrderDto,
} from "@/dtos/common.dto";
import { User } from "@/decorators/user.decorator";
import { UsersEntity } from "@/entities/user.entity";

@ApiTags("Settlements")
@Controller("settlements")
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @ApiOperation({ summary: "Get settlements Transactions - Admin, Ops, Owner" })
  @Role(USERS_ROLE.OPS, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Get()
  async getSettlementsAdmin(@Query() query: PaginationWithDateDto) {
    return this.settlementsService.findAllSettlementsTransactions(query);
  }

  @ApiOperation({
    summary: "Get unsettled transaction grouped by user - Admin, Ops, Owner",
  })
  @Role(USERS_ROLE.OPS, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Get("unsettled")
  async getPendingSettlements(
    @Query() query: PaginationWithoutSortAndOrderDto,
  ) {
    return this.settlementsService.getPendingSettlements(query);
  }

  @ApiOperation({
    summary: "Get unsettled details by user id - Admin, Ops, Owner",
  })
  @Role(USERS_ROLE.OPS, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Get("unsettled/:userId")
  async getPendingSettlementsByUserId(@Param("userId") userId: string) {
    return this.settlementsService.getPendingSettlementsByUserId(userId);
  }

  @ApiOperation({ summary: "Get settlements Daily Stats - Admin, Ops, Owner" })
  @Role(USERS_ROLE.OPS, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Get("stats")
  async getSettlementsStats() {
    return this.settlementsService.getSettlementsStats();
  }

  // @ApiOperation({ summary: "Get settlements Daily Stats - Admin, Ops, Owner" })
  // @Role(USERS_ROLE.OPS, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  // @Get("list")
  // async getSettlementsList(@Query() query: GetSettlementListDto) {
  //   return this.settlementsService.getUnsettledAmountGroupedByUser(query);
  // }

  @ApiOperation({
    summary: "Initiate settlement payout - Admin, Ops, Owner",
  })
  @Role(USERS_ROLE.OPS, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Post("initiate")
  async initiateSettlementPayout(
    @Body() initiateSettlementAdminDto: InitiateSettlementAdminDto,
    @User() user: UsersEntity,
  ) {
    return this.settlementsService.initiateSettlement(
      initiateSettlementAdminDto,
      user,
    );
  }

  @ApiOperation({ summary: "Create Wallets for all merchants - Owner" })
  @Role(USERS_ROLE.OWNER)
  @Post("create-wallets")
  async createWalletForMerchants() {
    return this.settlementsService.createWalletForMerchants();
  }

  @ApiOperation({ summary: "Get all settlements for a merchant" })
  @Role(USERS_ROLE.MERCHANT)
  @Get("merchant")
  async getAllSettlementsForMerchant(
    @User() user: UsersEntity,
    @Query() query: PaginationWithDateDto,
  ) {
    return this.settlementsService.getAllSettlementsForMerchant(user.id, query);
  }
}
