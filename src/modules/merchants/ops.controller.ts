import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { MerchantsEntity } from "entities/merchants.entity";
import { AuthGuard } from "guard/auth.guard";
import { OpsGuard } from "guard/ops.guard";
import { MerchantsService } from "./merchants.service";

@UseGuards(AuthGuard)
@ApiTags("Merchants - Ops")
@Controller("ops/merchants")
export class MerchantsControllerOps {
  constructor(private readonly _merchantsService: MerchantsService) {}

  @UseGuards(OpsGuard)
  @ApiOperation({ summary: "Get all merchants" })
  @ApiOkResponse({ type: [MerchantsEntity], isArray: true })
  @Get()
  async findMerchants() {
    return this._merchantsService.findMerchants();
  }

  @UseGuards(OpsGuard)
  @ApiOperation({ summary: "Get merchant by id" })
  @ApiOkResponse({ type: MerchantsEntity })
  @Get(":merchantId")
  async findMerchantById(@Param("merchantId") merchantId: string) {
    return this._merchantsService.findMerchantById(merchantId);
  }
}
