import { Body, Controller, Post, Res } from "@nestjs/common";
import { Response } from "express";
import { LoginMerchantDto } from "modules/merchants/merchants.dto";
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { MessageResponseDto } from "dtos/common.dto";
import { AuthService } from "./auth.service";
import { RegisterMerchantDto } from "./auth.dto";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly _authService: AuthService) {}

  @ApiOperation({ summary: "Register new merchant" })
  @ApiCreatedResponse({ type: MessageResponseDto })
  @ApiBadRequestResponse({ type: MessageResponseDto })
  @Post("register")
  async register(@Body() registerMerchantDto: RegisterMerchantDto) {
    return this._authService.register(registerMerchantDto);
  }

  @ApiOperation({ summary: "Login merchant" })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiBadRequestResponse({ type: MessageResponseDto })
  @Post("login")
  async login(
    @Body() loginMerchantDto: LoginMerchantDto,
    @Res() res: Response,
  ) {
    return this._authService.login(loginMerchantDto, res);
  }

  @ApiOperation({ summary: "Logout merchant" })
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("logout")
  async logout(@Res() res: Response) {
    return this._authService.logout(res);
  }
}
