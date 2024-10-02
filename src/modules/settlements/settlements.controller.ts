import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SettlementsService } from "./settlements.service";
import { InitiateSettlementAdminDto } from "./dto/initate-settlement-admin.dto";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";
import { PaginationDto } from "@/dtos/common.dto";

@ApiTags("Settlements")
@Controller("settlements")
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @ApiOperation({ summary: "Get settlements - Admin, Ops, Owner" })
  @Role(USERS_ROLE.OPS, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Get()
  getSettlementsAdmin(@Query() query: PaginationDto) {
    return this.settlementsService.getSettlementsAdmin(query);
  }

  @ApiOperation({
    summary: "Initiate settlement transaction - Admin, Ops, Owner",
  })
  @Role(USERS_ROLE.OPS, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  // @ApiCreatedResponse({ type: CreatePayoutPaymentResponseDto })
  @Post("initiate")
  async createPayOutTransaction(
    @Body() initiateSettlementAdminDto: InitiateSettlementAdminDto,
  ) {
    return this.settlementsService.initiateSettlementAdmin(
      initiateSettlementAdminDto,
    );
  }
}
