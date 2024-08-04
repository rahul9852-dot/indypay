import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { MerchantsEntity } from "entities/merchants.entity";
import { AuthGuard } from "guard/auth.guard";
import { User } from "decorators/user.decorator";
import {
  IAccessTokenPayload,
  IPendingSignUpPayload,
} from "interface/common.interface";
import { MerchantGuard } from "guard/merchant.guard";
import { PendingSignupGuard } from "guard/pendingSignup.guard";
import { MessageResponseDto } from "dtos/common.dto";
import {
  BusinessDetailsDto,
  VerifyOtpDto,
} from "modules/merchants/merchants.dto";
import { MerchantsService } from "./merchants.service";

@ApiTags("Merchants - Merchants")
@Controller("merchants")
export class MerchantsControllerMerchant {
  constructor(private readonly _merchantsService: MerchantsService) {}

  @UseGuards(AuthGuard, MerchantGuard)
  @ApiOperation({ summary: "Get self profile", security: [] })
  @ApiOkResponse({ type: MerchantsEntity })
  @Get("profile")
  async findMerchantByEmail(@User() user: IAccessTokenPayload) {
    return this._merchantsService.findMerchantById(user.id);
  }

  @UseGuards(PendingSignupGuard)
  @ApiOperation({ summary: "verify otp" })
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("verify-otp")
  async verifyOtp(
    @User() pendingSignUpPayload: IPendingSignUpPayload,
    @Body() verifyOtpDto: VerifyOtpDto,
  ) {
    return this._merchantsService.verifyOtp(pendingSignUpPayload, verifyOtpDto);
  }

  @UseGuards(PendingSignupGuard)
  @ApiOperation({ summary: "Add business details" })
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("business-details")
  async addBusinessDetails(
    @User() pendingSignUpPayload: IPendingSignUpPayload,
    @Body() businessDetailsDto: BusinessDetailsDto,
  ) {
    return this._merchantsService.addBusinessDetails(
      pendingSignUpPayload,
      businessDetailsDto,
    );
  }
}
