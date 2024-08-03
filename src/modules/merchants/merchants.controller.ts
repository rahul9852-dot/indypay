import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { MerchantsEntity } from "entities/merchants.entity";
import { AuthGuard } from "guard/auth.guard";
import { MerchantsService } from "./merchants.service";

@UseGuards(AuthGuard)
@ApiTags("Merchants")
@Controller("merchants")
export class MerchantsController {
  constructor(private readonly _merchantsService: MerchantsService) {}

  @ApiOperation({ summary: "Get all merchants" })
  @ApiOkResponse({ type: [MerchantsEntity], isArray: true })
  @Get()
  async findMerchants() {
    return await this._merchantsService.findMerchants();
  }

  @ApiOperation({ summary: "Get merchant by id" })
  @ApiOkResponse({ type: MerchantsEntity })
  @Get(":merchantId")
  async findMerchantById(@Param("merchantId") merchantId: string) {
    return await this._merchantsService.findMerchantById(merchantId);
  }
}
