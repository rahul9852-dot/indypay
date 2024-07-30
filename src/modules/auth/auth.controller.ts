import { Body, Controller, Post, Res } from "@nestjs/common";
import { Response } from "express";
import { LoginUserDto } from "modules/users/users.dto";
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { MessageResponseDto } from "dtos/common.dto";
import { JwtService } from "@nestjs/jwt";
import { Public } from "decorators/public.decorator";
import { appConfig } from "config/app.config";
import { CookieKeys } from "enums";
import { accessCookieOptions, refreshCookieOptions } from "utils/cookies.utils";
import { AuthService } from "./auth.service";
import { RegisterUserDto } from "./auth.dto";

const {
  jwtConfig: {
    accessTokenExpiresIn,
    refreshTokenExpiresIn,
    accessTokenSecret,
    refreshTokenSecret,
  },
} = appConfig();
@Public()
@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly _authService: AuthService,
    private readonly _jwtService: JwtService,
  ) {}

  @ApiOperation({ summary: "Register new user" })
  @ApiCreatedResponse({ type: MessageResponseDto })
  @ApiBadRequestResponse({ type: MessageResponseDto })
  @Post("register")
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this._authService.register(registerUserDto);
  }

  @ApiOperation({ summary: "Login user" })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiBadRequestResponse({ type: MessageResponseDto })
  @Post("login")
  async login(@Body() loginUserDto: LoginUserDto, @Res() res: Response) {
    const user = await this._authService.login(loginUserDto);

    const accessToken = await this._jwtService.signAsync(
      {
        userId: user.id,
        email: user.email,
      },
      {
        expiresIn: accessTokenExpiresIn,
        secret: accessTokenSecret,
      },
    );

    const refreshToken = await this._jwtService.signAsync(
      {
        userId: user.id,
        email: user.email,
      },
      {
        expiresIn: refreshTokenExpiresIn,
        secret: refreshTokenSecret,
      },
    );

    res.cookie(CookieKeys.AccessToken, accessToken, accessCookieOptions);

    res.cookie(CookieKeys.RefreshToken, refreshToken, refreshCookieOptions);

    return res.status(200).json(new MessageResponseDto("Login successful"));
  }

  @ApiOperation({ summary: "Logout user" })
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("logout")
  async logout(@Res() res: Response) {
    res.clearCookie(CookieKeys.AccessToken, accessCookieOptions);
    res.clearCookie(CookieKeys.RefreshToken, refreshCookieOptions);

    return res.status(200).json(new MessageResponseDto("Logout successful"));
  }
}
