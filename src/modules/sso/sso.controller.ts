import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SsoService } from "./sso.service";
import {
  GenerateUrlResponseDto,
  VerifyTokenDto,
  VerifyTokenResponseDto,
} from "./dto/sso.dto";
import { Public } from "@/decorators/public.decorator";
import { IgnoreBusinessDetails } from "@/decorators/ignore-business-details.decorator";
import { IgnoreKyc } from "@/decorators/ignore-kyc.decorator";
import { IgnoreMobileVerification } from "@/decorators/mobile.decorator";
import { User } from "@/decorators/user.decorator";
import { UsersEntity } from "@/entities/user.entity";

@ApiTags("SSO for Invoices")
@IgnoreBusinessDetails()
@IgnoreKyc()
@IgnoreMobileVerification()
@Controller("sso")
export class SsoController {
  constructor(private readonly ssoService: SsoService) {}

  @ApiOperation({
    summary: "Generate Url",
  })
  @ApiOkResponse({
    type: GenerateUrlResponseDto,
  })
  @Get("generate-url")
  async generateUrl(@User() user: UsersEntity) {
    return this.ssoService.generateUrl(user);
  }

  @Public()
  @ApiOperation({
    summary: "Verify Token",
  })
  @ApiOkResponse({
    type: VerifyTokenResponseDto,
  })
  @Post("verify-token")
  async verifyToken(@Body() verifyTokenDto: VerifyTokenDto) {
    return this.ssoService.verifyToken(verifyTokenDto);
  }
}
