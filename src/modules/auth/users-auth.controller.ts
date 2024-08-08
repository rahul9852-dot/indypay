import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiExcludeEndpoint,
} from "@nestjs/swagger";
import { Response } from "express";

import { AuthService } from "./auth.service";
import {
  LoginUserDto,
  OAuthGoogleTokenDataResponseDto,
  OAuthProviderDto,
  OAuthVerifyTokenDto,
  RegisterUserDto,
} from "./auth.dto";
import { OAUTH_PROVIDER } from "@/enums";
import { MessageResponseDto } from "@/dtos/common.dto";
import { appConfig } from "@/config/app.config";

const {
  oauthGoogle: { feRedirectUrl },
} = appConfig();

@ApiTags("Authentication - Users")
@Controller("auth")
export class UsersAuthController {
  constructor(private readonly _authService: AuthService) {}

  @ApiOperation({ summary: "OAuth2 Verify Token" })
  @ApiOkResponse({ type: OAuthGoogleTokenDataResponseDto })
  @ApiBadRequestResponse({ type: MessageResponseDto })
  @Get("users/verify-token/:provider")
  async oauthVerifyToken(
    @Param() { provider }: OAuthProviderDto,
    @Query() oauthVerifyTokenDto: OAuthVerifyTokenDto,
  ): Promise<OAuthGoogleTokenDataResponseDto> {
    if (provider === OAUTH_PROVIDER.GOOGLE) {
      return this._authService.oauthVerifyTokenGoogle(oauthVerifyTokenDto);
    }

    // TODO: MICROSOFT
    // if (provider === OAUTH_PROVIDER.MICROSOFT) {
    //   return this._authService.oauthVerifyTokenMicrosoft(oauthVerifyTokenDto);
    // }

    throw new BadRequestException(new MessageResponseDto("Invalid provider"));
  }

  @ApiOperation({ summary: "Send magic link on whatsapp" })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiBadRequestResponse({ type: MessageResponseDto })
  @Post("users/send-magic-link")
  async sendMagicLinkOnWhatsapp(@Body() registerUserDto: RegisterUserDto) {
    return this._authService.sendMagicLinkOnWhatsapp(registerUserDto);
  }

  @ApiExcludeEndpoint()
  @Post("users/register")
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this._authService.registerUser(registerUserDto);
  }

  @ApiOperation({ summary: "Login user" })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiBadRequestResponse({ type: MessageResponseDto })
  @Post("users/login")
  async login(@Body() loginUserDto: LoginUserDto, @Res() res: Response) {
    return this._authService.loginUser(loginUserDto, res);
  }

  // @ApiOperation({ summary: "Enable 2FA and login user" })
  // @ApiOkResponse({ type: MessageResponseDto })
  // @ApiBadRequestResponse({ type: MessageResponseDto })
  // @Post("users/enable-2fa-login")
  // async enable2FAAndLogin(
  //   @Body() loginUserDto: LoginUserDto,
  //   @Res() res: Response,
  // ) {
  //   return this._authService.enable2FAAndLogin(loginUserDto, res);
  // }

  @ApiOperation({ summary: "Logout user" })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiBadRequestResponse({ type: MessageResponseDto })
  @Get("users/logout")
  async logout(@Res() res: Response) {
    return this._authService.logout(res);
  }

  @ApiOperation({
    summary: "OAuth2 Generate Url",
    description: `Success: ${feRedirectUrl}?token={token}, Error: ${feRedirectUrl}?error={error}`,
  })
  @ApiOkResponse({ type: String })
  @ApiBadRequestResponse({ type: MessageResponseDto })
  @Get("users/:provider")
  async oauth2(@Param() { provider }: OAuthProviderDto) {
    if (provider === OAUTH_PROVIDER.GOOGLE) {
      return this._authService.oauth2Google();
    }
    if (provider === OAUTH_PROVIDER.MICROSOFT) {
      return this._authService.oauth2Microsoft();
    }

    throw new BadRequestException(new MessageResponseDto("Invalid provider"));
  }

  @ApiExcludeEndpoint()
  @Get("otpless/callback")
  async otplessCallback(@Query() param: OtpLessCallbackParam) {
    return this._authService.otplessCallback(param);
  }

  // handle callback
  @ApiExcludeEndpoint()
  @Get(":provider/callback")
  async oauth2Callback(
    @Param() { provider }: OAuthProviderDto,
    @Query() param: OAuthCallbackParam,
    @Res() res: Response,
  ) {
    if (provider === OAUTH_PROVIDER.GOOGLE) {
      return this._authService.oauth2GoogleCallback(param, res);
    }
    if (provider === OAUTH_PROVIDER.MICROSOFT) {
      return this._authService.oauth2MicrosoftCallback(param, res);
    }

    throw new BadRequestException(new MessageResponseDto("Invalid provider"));
  }
}
