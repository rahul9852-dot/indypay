import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Response } from "express";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";

import {
  LoginUserDto,
  OAuthGoogleTokenDataResponseDto,
  OAuthVerifyTokenDto,
  RegisterUserDto,
} from "./auth.dto";
import { CustomLogger } from "@/logger";
import { getGoogleOAuthTokens, getGoogleOAuthUrl } from "@/utils/oauth.utils";
import { appConfig } from "@/config/app.config";
import { AxiosService } from "@/shared/axios/axios.service";
import { MessageResponseDto } from "@/dtos/common.dto";
import { UsersService } from "@/modules/users/users.service";
import { BusinessDetailsEntity } from "@/entities/business-details.entity";
import { COOKIE_KEYS } from "@/enums";
import {
  accessCookieOptions,
  refreshCookieOptions,
} from "@/utils/cookies.utils";
import { NotificationService } from "@/shared/notification/notification.service";
import { VerificationGateway } from "@/modules/gateway/verification.gateway";
import { MfAuthService } from "@/modules/mf-auth/mf-auth.service";
import { OnboardingUsersEntity } from "@/entities/onboarding-user.entity";

const {
  oauthGoogle: { feRedirectUrl: feRedirectUrlGoogle, clientId: clientIdGoogle },
  jwtConfig: {
    accessTokenExpiresIn,
    accessTokenSecret,
    refreshTokenExpiresIn,
    refreshTokenSecret,
  },
} = appConfig();

@Injectable()
export class AuthService {
  logger = new CustomLogger(AuthService.name);
  axiosInstanceGoogle = new AxiosService("https://oauth2.googleapis.com");

  constructor(
    @InjectRepository(BusinessDetailsEntity)
    private readonly _businessDetailsRepository: Repository<BusinessDetailsEntity>,

    @InjectRepository(OnboardingUsersEntity)
    private readonly _onboardingUsersRepository: Repository<OnboardingUsersEntity>,

    private readonly _usersService: UsersService,
    private readonly _jwtService: JwtService,
    private readonly _notificationService: NotificationService,
    private readonly _verificationGateway: VerificationGateway,
    private readonly _mFAuthService: MfAuthService,
  ) {}

  async sendMagicLinkOnWhatsapp(registerUserDto: RegisterUserDto) {
    const onboardingUser =
      this._onboardingUsersRepository.create(registerUserDto);

    await this._onboardingUsersRepository.save(onboardingUser);

    await this._notificationService.sendMagicLinkOnWhatsapp(
      registerUserDto.mobile,
    );

    return new MessageResponseDto("Magic link sent successfully");
  }

  async oauth2Google() {
    return getGoogleOAuthUrl();
  }

  async oauth2Microsoft() {
    this.logger.debug("oauth2Microsoft");
  }

  async oauth2GoogleCallback(param: OAuthCallbackParam, res: Response) {
    this.logger.debug(
      `oauth2 Google Callback with param: ${JSON.stringify(param)}`,
    );

    const { code } = param ?? {};

    if (!code) {
      res.redirect(`${feRedirectUrlGoogle}?error=code_not_found`);
    }

    const { id_token } = (await getGoogleOAuthTokens({ code })) ?? {};

    if (!id_token) {
      res.redirect(`${feRedirectUrlGoogle}?error=id_token_not_found`);
    }

    const url = `${feRedirectUrlGoogle}?token=${id_token}`;

    res.redirect(url);
  }

  async oauth2MicrosoftCallback(param: OAuthCallbackParam, res: Response) {
    this.logger.debug(
      `oauth2 Microsoft Callback with param: ${JSON.stringify(param)}`,
    );

    // const { code } = param ?? {};

    // if (!code) {
    //   res.redirect(`${feRedirectUrlGoogle}?error=code_not_found`);
    // }

    return res.json({ message: "Not implemented yet" });
  }

  async oauthVerifyTokenGoogle({
    token,
    isInternalUser = false,
  }: {
    token: string;
    isInternalUser?: boolean;
  }): Promise<OAuthGoogleTokenDataResponseDto> {
    this.logger.debug(`oauthVerifyToken - token: ${JSON.stringify(token)}`);

    const tokenInfo =
      await this.axiosInstanceGoogle.getRequest<OAuthGoogleTokenData>(
        `tokeninfo?id_token=${token}`,
      );

    // Verify audience
    if (tokenInfo.aud !== clientIdGoogle) {
      throw new UnauthorizedException(
        new MessageResponseDto("Token audience mismatch"),
      );
    }

    // Verify issuer
    if (
      tokenInfo.iss !== "accounts.google.com" &&
      tokenInfo.iss !== "https://accounts.google.com"
    ) {
      throw new UnauthorizedException(
        new MessageResponseDto("Token issuer mismatch"),
      );
    }

    // Verify expiration
    if (parseInt(tokenInfo.exp) < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException(new MessageResponseDto("Token expired"));
    }

    let is2FAEnabled = true;
    let image = tokenInfo.picture;
    let fullName = tokenInfo.name;

    if (isInternalUser) {
      // TODO: get internal user
      // const internalUser = await
    } else {
      const user = await this._usersService.findByEmail(tokenInfo.email);
      if (user) {
        is2FAEnabled = user.is2FAEnabled;
        image = user.image;
        fullName = user.fullName;
      }
    }

    return {
      email: tokenInfo.email,
      emailVerified: tokenInfo.email_verified,
      image,
      fullName,
      is2FAEnabled,
    };
  }

  async oauthVerifyTokenMicrosoft(oauthVerifyTokenDto: OAuthVerifyTokenDto) {
    this.logger.debug(
      `oauthVerifyToken - oauthVerifyTokenDto: ${JSON.stringify(
        oauthVerifyTokenDto,
      )}`,
    );

    return oauthVerifyTokenDto.token;
  }

  async otplessCallback(otpLessCallbackParam: OtpLessCallbackParam) {
    this.logger.debug(
      `otplessCallback - otpLessCallbackParam: ${JSON.stringify(
        otpLessCallbackParam,
      )}`,
    );

    const { code } = otpLessCallbackParam ?? {};

    const user = await this._notificationService.getUserWithCode(code);

    if (!user) {
      throw new BadRequestException(new MessageResponseDto("Invalid code"));
    }

    const { phone_number } = user;

    const onboardingUser = await this._onboardingUsersRepository.findOne({
      where: { mobile: phone_number.replaceAll("+", "") },
    });

    return this._verificationGateway.handleMobileVerify(onboardingUser);
  }

  async registerUser(registerUserDto: RegisterUserDto) {
    this.logger.debug(
      `registerUser - registerUserDto: ${JSON.stringify(registerUserDto)}`,
    );

    const { fullName, email, mobile, businessName, designation } =
      registerUserDto;

    const createBusinessDetails = this._businessDetailsRepository.create({
      businessName,
      designation,
    });

    const savedBusinessDetails = await this._businessDetailsRepository.save(
      createBusinessDetails,
    );

    const user = await this._usersService.create(
      {
        fullName,
        email,
        mobile,
      },
      savedBusinessDetails.id,
    );

    return {
      userId: user.id,
    };
  }

  // async enable2FAAndLogin(loginUserDto: LoginUserDto, res: Response) {
  //   const { email, code2FA } = loginUserDto;
  //   // search user
  //   const user = await this._usersService.findByEmail(email);

  //   if (!user) {
  //     throw new NotFoundException(new MessageResponseDto("User not found"));
  //   }

  //   // TODO: setup and verify 2FA code

  //   await this._usersService.update2FA();

  //   // set access and refresh token
  //   const payload = {
  //     id: user.id,
  //     email: user.email,
  //   };
  //   const accessToken = this.generateAccessToken(payload);
  //   const refreshToken = this.generateRefreshToken(payload);

  //   res
  //     .cookie(COOKIE_KEYS.ACCESS_TOKEN, accessToken, accessCookieOptions)
  //     .cookie(COOKIE_KEYS.REFRESH_TOKEN, refreshToken, refreshCookieOptions)
  //     .json(new MessageResponseDto("User logged in successfully"));
  // }

  async loginUser(loginUserDto: LoginUserDto, res: Response) {
    this.logger.debug(
      `loginUser - loginUserDto: ${JSON.stringify(loginUserDto)}`,
    );

    const { email, code2FA } = loginUserDto;

    // search user
    const user = await this._usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    // verify 2FA code
    const isVerify = await this._mFAuthService.verifyCode({
      secret: user.secret2FA,
      token: code2FA,
    });

    if (!isVerify) {
      throw new BadRequestException(new MessageResponseDto("Invalid code"));
    }

    // set access and refresh token
    const payload = {
      id: user.id,
      email: user.email,
    };
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    res
      .cookie(COOKIE_KEYS.ACCESS_TOKEN, accessToken, accessCookieOptions)
      .cookie(COOKIE_KEYS.REFRESH_TOKEN, refreshToken, refreshCookieOptions)
      .json(new MessageResponseDto("User logged in successfully"));
  }

  async logout(res: Response) {
    res
      .clearCookie(COOKIE_KEYS.ACCESS_TOKEN, accessCookieOptions)
      .clearCookie(COOKIE_KEYS.REFRESH_TOKEN, refreshCookieOptions)
      .json(new MessageResponseDto("User logged out successfully"));
  }

  generateAccessToken(payload: Record<string, any>) {
    return this._jwtService.sign(payload, {
      secret: accessTokenSecret,
      expiresIn: accessTokenExpiresIn,
    });
  }

  generateRefreshToken(payload: Record<string, any>) {
    return this._jwtService.sign(payload, {
      secret: refreshTokenSecret,
      expiresIn: refreshTokenExpiresIn,
    });
  }
}
