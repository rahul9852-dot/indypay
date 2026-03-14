import {
  Body,
  Controller,
  HttpCode,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Request, Response } from "express";
import { UseInterceptors } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { SendOtpDto, SendOtpResDto, VerifyOtpDto } from "./dto/send-otp.dto";
import { Verify2FADto } from "./dto/verify-2fa.dto";
import { AuthService } from "./auth.service";
import { RegisterUserDto } from "./dto/register-user.dto";
import { VerifyContactDto } from "./dto/verify-contact.dto";
import { LoginUserDto } from "./dto/login-user.dto";
import { SendSignupOtpDto } from "./dto/send-signup-otp.dto";
import { Update2FAStatusDto } from "./dto/toggle-two-fa";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { Public } from "@/decorators/public.decorator";
import { VerifyMobileGuard } from "@/guard/verify-mobile.guard";
import { IgnoreMobileVerification } from "@/decorators/mobile.decorator";
import { RefreshGuard } from "@/guard/refesh.guard";
import { User } from "@/decorators/user.decorator";
import { Mobile } from "@/decorators/mobile.decorator";
import { MessageResponseDto } from "@/dtos/common.dto";
import { IgnoreBusinessDetails } from "@/decorators/ignore-business-details.decorator";
import { IgnoreKyc } from "@/decorators/ignore-kyc.decorator";
import { AuthGuard } from "@/guard/auth.guard";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";
import { UsersEntity } from "@/entities/user.entity";
import { AuthEncryptionInterceptor } from "@/interceptors/auth-encryption.interceptor";

@ApiTags("Auth")
@IgnoreBusinessDetails()
@IgnoreKyc()
@Controller({
  path: "auth",
  version: "1",
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  // private readonly logger = new CustomLogger(AuthController.name);

  @Post("2fa")
  @ApiOperation({
    summary: "Enable two-factor authentication status",
    description:
      "For regular users, this will toggle their own 2FA status. For admins, a userId must be provided to toggle another user's 2FA status.",
  })
  @ApiOkResponse({
    type: MessageResponseDto,
    description: "Returns success message indicating the new 2FA status",
  })
  async enable2FA(@User() user: UsersEntity) {
    return this.authService.enable2FA(user.id);
  }

  @Patch("2fa/admin")
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @ApiOperation({
    summary: "Update two-factor authentication status",
  })
  async update2FAAdmin(@Body() body: Update2FAStatusDto) {
    return this.authService.update2FAStatusAdmin(body.userId, body.isEnabled);
  }

  // 10 verify attempts/min — brute-forcing a 6-digit space needs ~1000 tries;
  // this makes exhausting it within the 5-min OTP window practically impossible.
  @Throttle({ otp: { limit: 10, ttl: 60_000 } })
  @Public()
  @ApiOperation({
    summary: "Verify 2FA code and complete login",
    description:
      "After receiving the 2FA code via SMS, use this endpoint to verify the code and complete the login process.",
  })
  @ApiResponse({
    status: 200,
    description: "Login successful",
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid verification code or session expired",
  })
  @Post("verify-2fa")
  @HttpCode(200)
  async verify2FA(
    @Body() verifyDto: Verify2FADto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const result = await this.authService.verify2FA(
        verifyDto.token,
        req,
        res,
      );

      return res.status(200).json({
        ...result,
        message: "Login successful",
      });
    } catch (error) {
      if (!res.headersSent) {
        return res.status(400).json({
          message: error.message || "Verification failed",
          error: "Bad Request",
        });
      }
    }
  }

  // 10 login attempts/min per IP — complements the per-email account lock (S-11)
  // by adding IP-level protection; a credential-stuffing script is blocked here
  // before it can rotate through many email addresses.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Public()
  @UseInterceptors(AuthEncryptionInterceptor)
  @ApiOperation({
    summary: "Login",
  })
  @Post("login")
  @HttpCode(200)
  @ApiOkResponse({ type: MessageResponseDto })
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const result = await this.authService.login(loginUserDto, req, res);

      return res.status(200).json(result);
    } catch (error) {
      if (!res.headersSent) {
        throw error;
      }
    }
  }

  // 5 OTP sends/min — each call triggers an SMS/email; cap prevents an attacker
  // from using the endpoint as a paid messaging relay (S-2).
  @Throttle({ otp: { limit: 5, ttl: 60_000 } })
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
  @UseInterceptors(AuthEncryptionInterceptor)
  @ApiOperation({
    summary: "Register merchant - Step 2: Verify contact",
  })
  @Post("register-contact")
  @HttpCode(200)
  @ApiOkResponse({ type: MessageResponseDto })
  async onboarding(
    @Body() verifyContactDto: VerifyContactDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.authService.verifyContact(verifyContactDto, req, res);
  }

  @Public()
  @Post("google")
  @HttpCode(200)
  @ApiOkResponse({ type: MessageResponseDto })
  async googleAuth(
    @Body() dto: any,
    // @Body() dto: GoogleAuthDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.authService.googleAuth(dto, req, res);
  }

  @ApiOperation({
    summary: "Merchant Register by Admin",
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

  @Public()
  @UseGuards(VerifyMobileGuard)
  @ApiOperation({
    summary: "Forgot Password - Inside Dashboard",
  })
  @Post("forgot-password")
  async forgotPassword(
    @Mobile() mobile: string,
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(mobile, forgotPasswordDto);
  }

  // Same OTP cost rationale as send-signup-otp — same 5/min cap (S-2).
  @Throttle({ otp: { limit: 5, ttl: 60_000 } })
  @Public()
  @ApiOperation({
    summary: "Forgot password - Step 1: Send OTP",
  })
  @HttpCode(200)
  @ApiOkResponse({ type: SendOtpResDto })
  @Post("send-forgot-password-otp")
  async sendForgotPasswordOtp(
    @Body() sendOtpDto: SendOtpDto,
    @Res() res: Response,
  ) {
    return this.authService.sendForgotPasswordOtp(sendOtpDto, res);
  }

  @Public()
  @IgnoreMobileVerification()
  @UseGuards(VerifyMobileGuard)
  @ApiOperation({
    summary: "Forgot password - Step 2: Verify OTP",
  })
  @HttpCode(200)
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("verify-forgot-password-otp")
  async verifyForgotPasswordOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Res() res: Response,
  ) {
    return this.authService.verifyForgotPasswordOtp(verifyOtpDto, res);
  }

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
    @User() user: UsersEntity,
  ) {
    return this.authService.refreshToken(user, req, res);
  }
}
