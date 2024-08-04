import { BadRequestException, Injectable } from "@nestjs/common";
import { Response } from "express";
import { JwtService } from "@nestjs/jwt";

import { LoginMerchantDto } from "modules/merchants/merchants.dto";
import {
  IAccessTokenPayload,
  IRefreshTokenPayload,
} from "interface/common.interface";
import { MerchantsService } from "modules/merchants/merchants.service";
import { BcryptService } from "shared/bcrypt/bcrypt.service";
import { MessageResponseDto } from "dtos/common.dto";
import { COOKIE_KEYS } from "enums";
import { appConfig } from "config/app.config";
import {
  accessCookieOptions,
  pendingSignUpCookieOptions,
  refreshCookieOptions,
} from "utils/cookies.utils";
import { RegisterMerchantDto } from "./auth.dto";

const {
  jwtConfig: {
    accessTokenExpiresIn,
    accessTokenSecret,
    refreshTokenExpiresIn,
    refreshTokenSecret,
    pendingSignUpTokenExpiresIn,
    pendingSignUpTokenSecret,
  },
} = appConfig();

@Injectable()
export class AuthService {
  constructor(
    private readonly _merchantsService: MerchantsService,
    private readonly _bcryptService: BcryptService,
    private readonly _jwtService: JwtService,
  ) {}

  async register(registerMerchantDto: RegisterMerchantDto, response: Response) {
    const merchant =
      await this._merchantsService.createMerchant(registerMerchantDto);

    const pendingSignUpToken = await this._jwtService.signAsync(
      {
        id: merchant.id,
        email: merchant.email,
        onboardingStatus: merchant.onboardingStatus,
      },
      {
        expiresIn: pendingSignUpTokenExpiresIn,
        secret: pendingSignUpTokenSecret,
      },
    );

    return response
      .status(201)
      .cookie(
        COOKIE_KEYS.PENDING_SIGN_UP,
        pendingSignUpToken,
        pendingSignUpCookieOptions,
      )
      .json(new MessageResponseDto("Merchant created successfully"));
  }

  async login(loginMerchantDto: LoginMerchantDto, response: Response) {
    const merchant = await this._merchantsService.findActiveMerchant(
      loginMerchantDto.email,
    );

    if (!merchant) {
      throw new BadRequestException(
        new MessageResponseDto("Merchant or password is incorrect"),
      );
    }

    const isMatch = await this._bcryptService.comparePassword(
      loginMerchantDto.password,
      merchant.password,
    );

    if (!isMatch) {
      throw new BadRequestException(
        new MessageResponseDto("Merchant or password is incorrect"),
      );
    }

    const accessToken = await this.generateAccessToken({
      id: merchant.id,
      email: merchant.email,
    });

    const refreshToken = await this.generateRefreshToken({
      id: merchant.id,
      email: merchant.email,
    });

    return response
      .status(201)
      .cookie(COOKIE_KEYS.REFRESH_TOKEN, refreshToken, refreshCookieOptions)
      .cookie(COOKIE_KEYS.ACCESS_TOKEN, accessToken, accessCookieOptions)
      .json(new MessageResponseDto("Merchant login successful"));
  }

  async logout(response: Response) {
    return response
      .status(200)
      .clearCookie(COOKIE_KEYS.REFRESH_TOKEN, refreshCookieOptions)
      .clearCookie(COOKIE_KEYS.ACCESS_TOKEN, accessCookieOptions)
      .json(new MessageResponseDto("Merchant logout successful"));
  }

  async generateAccessToken(merchant: IAccessTokenPayload) {
    return this._jwtService.signAsync(
      {
        id: merchant.id,
        email: merchant.email,
      },
      {
        expiresIn: accessTokenExpiresIn,
        secret: accessTokenSecret,
      },
    );
  }

  async generateRefreshToken(merchant: IRefreshTokenPayload) {
    return this._jwtService.signAsync(
      {
        id: merchant.id,
        email: merchant.email,
      },
      {
        expiresIn: refreshTokenExpiresIn,
        secret: refreshTokenSecret,
      },
    );
  }
}
