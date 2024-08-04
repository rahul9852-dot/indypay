import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { MerchantsEntity } from "entities/merchants.entity";
import { AuthGuard } from "guard/auth.guard";
import { AdminGuard } from "guard/admin.guard";
import { MerchantsService } from "./merchants.service";

@UseGuards(AuthGuard)
@ApiTags("Merchants - Admin")
@Controller("admin/merchants")
export class MerchantsControllerAdmin {
  constructor(private readonly _merchantsService: MerchantsService) {}

  @UseGuards(AdminGuard)
  @ApiOperation({ summary: "Get all merchants" })
  @ApiOkResponse({ type: [MerchantsEntity], isArray: true })
  @Get()
  async findMerchants() {
    return this._merchantsService.findMerchants();
  }

  @UseGuards(AdminGuard)
  @ApiOperation({ summary: "Get merchant by id" })
  @ApiOkResponse({ type: MerchantsEntity })
  @Get(":merchantId")
  async findMerchantById(@Param("merchantId") merchantId: string) {
    return this._merchantsService.findMerchantById(merchantId);
  }
}
