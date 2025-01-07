import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Request, Response } from "express";
import { SendOtpDto, SendOtpResDto, VerifyOtpDto } from "./dto/send-otp.dto";
import { AuthService } from "./auth.service";
import { RegisterUserDto } from "./dto/register-user.dto";
import { VerifyContactDto } from "./dto/verify-contact.dto";
import { LoginUserDto } from "./dto/login-user.dto";
import { SendSignupOtpDto } from "./dto/send-signup-otp.dto";

import { Public } from "@/decorators/public.decorator";
import { VerifyMobileGuard } from "@/guard/verify-mobile.guard";
import { IgnoreMobileVerification } from "@/decorators/mobile.decorator";
import { RefreshGuard } from "@/guard/refesh.guard";
import { User } from "@/decorators/user.decorator";
import { IRefreshTokenPayload } from "@/interface/common.interface";
import { MessageResponseDto } from "@/dtos/common.dto";
import { IgnoreBusinessDetails } from "@/decorators/ignore-business-details.decorator";
import { IgnoreKyc } from "@/decorators/ignore-kyc.decorator";
import { AuthGuard } from "@/guard/auth.guard";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";
import { UsersEntity } from "@/entities/user.entity";

@ApiTags("Auth")
@IgnoreBusinessDetails()
@IgnoreKyc()
@Controller({
  path: "auth",
  version: "1",
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiOperation({
    summary: "Login",
  })
  @Post("login")
  @HttpCode(200)
  @ApiOkResponse({ type: MessageResponseDto })
  async login(@Body() loginUserDto: LoginUserDto, @Res() res: Response) {
    return this.authService.login(loginUserDto, res);
  }

  @Public()
  @ApiOperation({
    summary: "Register merchant - Step 1: Send OTPs",
  })
  @Post("send-signup-otp")
  @HttpCode(200)
  @ApiOkResponse({ type: MessageResponseDto })
  async sendSignupOtp(@Body() sendSignupOtpDto: SendSignupOtpDto) {
    return this.authService.sendSignupOtp(sendSignupOtpDto);
  }

  @Public()
  @ApiOperation({
    summary: "Step 2: Verify contact",
  })
  @Post("register-contact")
  @HttpCode(200)
  @ApiOkResponse({ type: MessageResponseDto })
  async onboarding(
    @Body() verifyContactDto: VerifyContactDto,
    @Res() res: Response,
  ) {
    return this.authService.verifyContact(verifyContactDto, res);
  }

  @ApiOperation({
    summary: "Register",
  })
  @UseGuards(AuthGuard)
  @IgnoreKyc()
  @IgnoreBusinessDetails()
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @ApiCreatedResponse({ type: MessageResponseDto })
  @Post("admin/register")
  async registerByAdmin(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.registerByAdmin(registerUserDto);
  }

  // @Public()
  // @ApiOperation({
  //   summary: "Forgot Password",
  // })
  // @Post("forgot-password")
  // async forgotPassword() {
  //   return this.authService.forgotPassword();
  // }

  @ApiOperation({
    summary: "Logout",
  })
  @HttpCode(200)
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("logout")
  async logout(
    @Req() req: Request,
    @Res() res: Response,
    @User() { id }: UsersEntity,
  ) {
    return this.authService.logout(req, res, id);
  }

  @Public()
  @ApiOperation({
    summary: "Send OTP mobile",
  })
  @HttpCode(200)
  @ApiOkResponse({ type: SendOtpResDto })
  @Post("send-otp")
  async sendOtp(@Body() sendOtpDto: SendOtpDto, @Res() res: Response) {
    return this.authService.sendOtp(sendOtpDto, res);
  }

  // @Public()
  // @ApiOperation({
  //   summary: "Resend OTP mobile",
  // })
  // @HttpCode(200)
  // @ApiOkResponse({ type: SendOtpResDto })
  // @Post("resend-otp")
  // async resendOtp(@Body() reSendOtpDto: ReSendOtpDto, @Res() res: Response) {
  //   return this.authService.resendOtp(reSendOtpDto, res);
  // }

  @Public()
  @IgnoreMobileVerification()
  @UseGuards(VerifyMobileGuard)
  @ApiOperation({
    summary: "Verify OTP mobile",
  })
  @HttpCode(200)
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("verify-otp")
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto, @Res() res: Response) {
    return this.authService.verifyOtp(verifyOtpDto, res);
  }

  @Public()
  @ApiOperation({
    summary: "Step 2: Verify OTP for mobile and email",
  })
  // @Post("verify-contact-otp")
  // @HttpCode(200)
  // @ApiOkResponse({ type: MessageResponseDto })
  // async verifyContactOtp(
  //   @Body() verifyOtpContactDto: VerifyOtpContactDto,
  //   @Res() res: Response,
  // ) {
  //   return this.authService.verifyContactOtp(verifyOtpContactDto, res);
  // }
  @Public()
  @UseGuards(RefreshGuard)
  @ApiOperation({
    summary: "Refresh Token",
  })
  @HttpCode(200)
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("refresh")
  async refreshToken(
    @Req() req: Request,
    @Res() res: Response,
    @User() user: IRefreshTokenPayload,
  ) {
    return this.authService.refreshToken(user, req, res);
  }
}
