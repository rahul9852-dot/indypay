import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SettlementsService } from "./settlements.service";
import { GetSettlementListDto } from "./dto/get-settlement-list.dto";
import { InitiateSettlementAdminDto } from "./dto/initate-settlement-admin.dto";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";
import { PaginationWithDateDto } from "@/dtos/common.dto";
import { User } from "@/decorators/user.decorator";
import { UsersEntity } from "@/entities/user.entity";

@ApiTags("Settlements")
@Controller("settlements")
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @ApiOperation({ summary: "Get settlements - Admin, Ops, Owner" })
  @Role(USERS_ROLE.OPS, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Get()
  async getSettlementsAdmin(@Query() query: PaginationWithDateDto) {
    return this.settlementsService.findAll(query);
  }

  @ApiOperation({ summary: "Get settlements List - Admin, Ops, Owner" })
  @Role(USERS_ROLE.OPS, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Get("list")
  async getSettlementsList(@Query() query: GetSettlementListDto) {
    return this.settlementsService.getSettlementsList(query);
  }

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
}
