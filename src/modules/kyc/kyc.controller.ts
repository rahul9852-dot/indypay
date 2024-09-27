import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { KycService } from "./kyc.service";
import { KycStatusResDto } from "./dto/kyc-status.dto";
import { User } from "@/decorators/user.decorator";
import { IAccessTokenPayload } from "@/interface/common.interface";
import { IgnoreKyc } from "@/decorators/ignore-kyc.decorator";

@ApiTags("KYC")
@Controller("kyc")
@IgnoreKyc()
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @ApiOperation({ summary: "Get KYC status" })
  @ApiOkResponse({ type: KycStatusResDto })
  @Get("status")
  async getKycStatus(@User() user: IAccessTokenPayload) {
    return this.kycService.getKycStatus(user);
  }
}
