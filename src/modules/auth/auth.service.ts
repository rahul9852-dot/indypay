import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Inject,
  NotFoundException,
} from "@nestjs/common";
import { Request, Response } from "express";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { OAuth2Client } from "google-auth-library";
import { ReSendOtpDto, SendOtpDto, VerifyOtpDto } from "./dto/send-otp.dto";
import { RegisterUserDto } from "./dto/register-user.dto";
import { LoginUserDto } from "./dto/login-user.dto";
import { VerifyContactDto } from "./dto/verify-contact.dto";
import { SendSignupOtpDto } from "./dto/send-signup-otp.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { SNSService } from "@/modules/aws/sns.service";
import { UsersEntity } from "@/entities/user.entity";
import { BcryptService } from "@/shared/bcrypt/bcrypt.service";
import { MessageResponseDto } from "@/dtos/common.dto";
import { appConfig } from "@/config/app.config";
import {
  accessCookieOptions,
  cookieOptions,
  mobileVerifyCookieOptions,
  refreshCookieOptions,
} from "@/utils/cookies.utils";
import { ACCOUNT_STATUS, COOKIE_KEYS, OAUTH_PROVIDER } from "@/enums";
import {
  IAccessTokenPayload,
  IRefreshTokenPayload,
  IVerifyMobilePayload,
} from "@/interface/common.interface";

import { AuthOtpEntity } from "@/entities/otp.entity";
import {
  formatTime,
  generateAttemptsKey,
  generateLockAccountKey,
  generateOtp,
  getUlidId,
} from "@/utils/helperFunctions.utils";
import {
  MAX_ATTEMPTS,
  REDIS_KEYS,
  LOCK_TIME_MS,
} from "@/constants/redis-cache.constant";
import { ONBOARDING_STATUS, USERS_ROLE } from "@/enums";
import { SESService } from "@/modules/aws/ses.service";
import { WalletEntity } from "@/entities/wallet.entity";
import { UserLoginIpsEntity } from "@/entities/user-login-ip.entity";
import { getCurrentUserIp } from "@/utils/request.utils";
import { CustomLogger } from "@/logger";
import { ERROR_MESSAGES } from "@/constants/messages.constant";

interface ICachedUserData {
  id: string;
  mobile: string;
  role: USERS_ROLE;
  email: string;
  onboardingStatus: ONBOARDING_STATUS;
  twoFactorEnabled: boolean;
}

const {
  jwtConfig: {
    accessTokenExpiresIn,
    accessTokenSecret,
    refreshTokenExpiresIn,
    refreshTokenSecret,
    twoFactorSecret,
  },
  isProduction,
} = appConfig();

interface IVerifyTokenPayload {
  id: string;
  role: USERS_ROLE;
  email: string;
  pending2FA: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new CustomLogger(AuthService.name);
  private googleClient: OAuth2Client;
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(AuthOtpEntity)
    private readonly authOtpRepository: Repository<AuthOtpEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
    @InjectRepository(UserLoginIpsEntity)
    private readonly userLoginIpsRepository: Repository<UserLoginIpsEntity>,

    private readonly bcryptService: BcryptService,
    private readonly jwtService: JwtService,
    private readonly snsService: SNSService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly sesService: SESService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async generate2FAToken(user: UsersEntity): Promise<string> {
    const token = generateOtp(6);
    const redisKey = REDIS_KEYS.TWO_FACTOR_TOKEN(user.id);

    // console.log('==========================================');
    // console.log('Generating 2FA Token');
    // console.log('Token:', token);
    // console.log('User ID:', user.id);
    // console.log('Redis Key:', redisKey);
    // console.log('==========================================');

    // Store token in Redis
    // Store with TTL of 5 minutes (300 seconds)
    await this.cacheManager.set(
      redisKey,
      token,
      300, // 5 minutes
    );

    // Verify storage
    const storedToken = await this.cacheManager.get<string>(redisKey);
    // console.log('Token Storage Verification:');
    // console.log('Stored Token:', storedToken);
    // console.log('Storage Successful:', token === storedToken);
    // console.log('==========================================');

    return token;
  }

  async login(loginUserDto: LoginUserDto, req: Request, res: Response) {
    const isLocked = await this.cacheManager.get<number>(
      generateLockAccountKey(loginUserDto.email),
    );
    if (isLocked) {
      throw new BadRequestException(
        new MessageResponseDto(
          `Account is locked. Please try again after ${formatTime(new Date(isLocked))}.`,
        ),
      );
    }

    const user = await this.usersRepository.findOne({
      where: {
        email: loginUserDto.email,
      },
      select: {
        id: true,
        mobile: true,
        password: true,
        onboardingStatus: true,
        role: true,
        email: true,
        twoFactorEnabled: true,
        accountStatus: true,
      },
    });

    if (!user) {
      throw new BadRequestException(
        new MessageResponseDto("Incorrect email or password"),
      );
    }

    const isPasswordValid = await this.bcryptService.compare(
      loginUserDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      const attemptsLeft = await this.handleFailedLogin(loginUserDto.email);
      throw new BadRequestException(
        new MessageResponseDto(
          `Incorrect email or password. ${attemptsLeft} attempts left.`,
        ),
      );
    }

    if (
      ![
        ACCOUNT_STATUS.ACTIVE,
        ACCOUNT_STATUS.INACTIVE,
        ACCOUNT_STATUS.INTERNAL_USER,
      ].includes(user.accountStatus)
    ) {
      throw new BadRequestException(
        ERROR_MESSAGES.accountStatusMsg(user.accountStatus),
      );
    }

    await this.cacheManager.del(generateAttemptsKey(loginUserDto.email));

    const currentIp = getCurrentUserIp(req);

    // Save login IP

    const isExistingIp = await this.userLoginIpsRepository.findOne({
      where: {
        userId: user.id,
        ipAddress: currentIp,
      },
    });

    if (!isExistingIp) {
      // Save new IP
      // FIXME: will send email for approval
      await this.userLoginIpsRepository.save(
        this.userLoginIpsRepository.create({
          ipAddress: currentIp,
          isApproved: true, // will change later
          userId: user.id,
        }),
      );
    }

    // If 2FA is enabled, send OTP and return early with VERIFY_TOKEN
    if (user.twoFactorEnabled) {
      const twoFactorToken = await this.generate2FAToken(user);

      // Send OTP via email
      const emailBody = `<p>Your two-factor authentication code is: <strong>${twoFactorToken}</strong></p><p>This code expires in 5 minutes.</p>`;
      const emailSent = await this.sesService.sendEmail(
        "Your Rupeeflow 2FA code",
        emailBody,
        user.email,
      );
      if (!emailSent?.success) {
        throw new BadRequestException(
          new MessageResponseDto("Failed to send 2FA code to your email"),
        );
      }

      try {
        const userData: ICachedUserData = {
          id: user.id,
          mobile: user.mobile,
          role: user.role,
          email: user.email,
          onboardingStatus: user.onboardingStatus,
          twoFactorEnabled: user.twoFactorEnabled,
        };

        await Promise.all([
          // Store 2FA token
          this.cacheManager.set(
            REDIS_KEYS.TWO_FACTOR_TOKEN(user.id),
            twoFactorToken,
          ),
          // Store pending flag
          this.cacheManager.set(REDIS_KEYS.TWO_FACTOR_PENDING(user.id), true),
          // Store user data
          this.cacheManager.set(REDIS_KEYS.USER_KEY(user.id), userData),
        ]);

        // Generate a verification token with user data
        const tokenPayload: IVerifyTokenPayload = {
          id: user.id,
          role: user.role,
          email: user.email,
          pending2FA: true,
        };

        const verifyToken = this.jwtService.sign(tokenPayload, {
          expiresIn: "5m",
          secret: twoFactorSecret,
        });

        res.cookie(COOKIE_KEYS.VERIFY_TOKEN, verifyToken, {
          ...cookieOptions,
          maxAge: 300000, // 5 minutes
        });

        return res.json({
          message: "Please enter the verification code sent to your email",
          ...(!isProduction && { code: twoFactorToken }),
        });
      } catch (error) {
        // console.error('Failed to setup 2FA session:', error);
        throw new BadRequestException(
          new MessageResponseDto("Failed to setup 2FA verification"),
        );
      }
    }

    // Update last login info
    if (!user.twoFactorEnabled) {
      await this.usersRepository.update(user.id, {
        lastLoginAt: new Date(),
        lastLoginIp: currentIp,
      });
    }

    const payload: IAccessTokenPayload = {
      id: user.id,
      mobile: user.mobile,
      onboardingStatus: user.onboardingStatus,
      role: user.role,
      email: user.email,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Set cookies
    try {
      res.cookie(COOKIE_KEYS.ACCESS_TOKEN, accessToken, accessCookieOptions);
      res.cookie(COOKIE_KEYS.REFRESH_TOKEN, refreshToken, refreshCookieOptions);
    } catch (error) {
      throw error;
    }
    res.cookie(COOKIE_KEYS.VERIFY_TOKEN, "", {
      ...mobileVerifyCookieOptions,
      maxAge: 0,
    });

    // Return the tokens and message
    const response = {
      message: "Login successful",
    };

    return response;
  }

  async googleAuth(dto: { googleToken: string }, req: Request, res: Response) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: dto.googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new BadRequestException("Invalid Google token");
    }

    const {
      email,
      email_verified,
      sub: googleId,
      given_name,
      family_name,
    } = payload;

    if (!email || !email_verified) {
      throw new BadRequestException("Google email not verified");
    }

    let user = await this.usersRepository.findOne({
      where: [{ googleId }, { email }],
    });

    // 🆕 FIRST TIME GOOGLE SIGNUP
    if (!user) {
      user = this.usersRepository.create({
        id: getUlidId(),
        email,
        googleId,
        authProvider: OAUTH_PROVIDER.GOOGLE,
        firstName: given_name,
        lastName: family_name,
        fullName: `${given_name ?? ""} ${family_name ?? ""}`.trim(),
        onboardingStatus: ONBOARDING_STATUS.SIGN_UP,
        role: USERS_ROLE.MERCHANT,
        accountStatus: ACCOUNT_STATUS.ACTIVE,
      });

      user = await this.usersRepository.save(user);

      // Create wallet (same as normal signup)
      await this.walletRepository.save(this.walletRepository.create({ user }));
    }

    // 🚫 Block disabled accounts
    if (
      ![ACCOUNT_STATUS.ACTIVE, ACCOUNT_STATUS.INTERNAL_USER].includes(
        user.accountStatus,
      )
    ) {
      throw new BadRequestException(
        ERROR_MESSAGES.accountStatusMsg(user.accountStatus),
      );
    }

    if (user.authProvider !== OAUTH_PROVIDER.GOOGLE) {
      throw new BadRequestException("Please login with password");
    }

    // 📍 Save login IP (reuse logic)
    const currentIp = getCurrentUserIp(req);

    const isExistingIp = await this.userLoginIpsRepository.findOne({
      where: { userId: user.id, ipAddress: currentIp },
    });

    if (!isExistingIp) {
      await this.userLoginIpsRepository.save(
        this.userLoginIpsRepository.create({
          userId: user.id,
          ipAddress: currentIp,
          isApproved: true,
        }),
      );
    }

    // 🕒 Update login info
    await this.usersRepository.update(user.id, {
      lastLoginAt: new Date(),
      lastLoginIp: currentIp,
    });

    // // 🔐 Generate tokens (reuse existing helpers)
    const tokenPayload: IAccessTokenPayload = {
      id: user.id,
      mobile: user.mobile,
      onboardingStatus: user.onboardingStatus,
      role: user.role,
      email: user.email,
    };

    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    // // 🍪 Set cookies
    res.cookie(COOKIE_KEYS.ACCESS_TOKEN, accessToken, accessCookieOptions);
    res.cookie(COOKIE_KEYS.REFRESH_TOKEN, refreshToken, refreshCookieOptions);

    return res.json({
      message: "Google login successful",
    });
  }

  async verify2FA(token: string, req: Request, res: Response) {
    try {
      const verifyToken = req.cookies?.[COOKIE_KEYS.VERIFY_TOKEN];
      if (!verifyToken) {
        throw new BadRequestException("Verification session expired");
      }

      // 2. Decode and validate JWT token
      let decodedToken: IVerifyTokenPayload;
      try {
        decodedToken = this.jwtService.verify(verifyToken, {
          secret: twoFactorSecret, // Using the same secret we used to sign
        }) as IVerifyTokenPayload;
      } catch (error) {
        this.logger.error("Failed to verify token");
        throw new BadRequestException("Invalid or expired verification token");
      }

      if (
        !decodedToken?.id ||
        !decodedToken?.role ||
        !decodedToken?.pending2FA
      ) {
        throw new BadRequestException("Invalid verification token structure");
      }

      // 3. Get and verify stored OTP first
      const userId = decodedToken.id;

      // Check all Redis keys
      // let it be for debugging puropse.
      const [storedToken] = await Promise.all([
        this.cacheManager.get<string>(REDIS_KEYS.TWO_FACTOR_TOKEN(userId)),
        this.cacheManager.get<boolean>(REDIS_KEYS.TWO_FACTOR_PENDING(userId)),
        this.cacheManager.get(REDIS_KEYS.USER_KEY(userId)),
      ]);

      // console.log('Redis State:');
      // console.log('2FA Token Key:', REDIS_KEYS.TWO_FACTOR_TOKEN(userId));
      // console.log('2FA Pending Key:', REDIS_KEYS.TWO_FACTOR_PENDING(userId));
      // console.log('User Data Key:', REDIS_KEYS.USER_KEY(userId));
      // console.log('Stored Token:', storedToken);
      // console.log('Is Pending:', isPending);
      // console.log('Has User Data:', !!userData);
      // console.log('Provided Token:', token);
      // console.log('Tokens Match:', token === storedToken);

      if (!storedToken) {
        throw new BadRequestException("Verification code expired");
      }

      if (token !== storedToken) {
        throw new BadRequestException("Invalid verification code");
      }

      const user = await this.usersRepository.findOne({
        where: { id: decodedToken.id },
        select: {
          id: true,
          mobile: true,
          onboardingStatus: true,
          role: true,
          email: true,
          twoFactorEnabled: true,
        },
      });

      // this.logger.log("User found in database");

      if (!user) {
        throw new BadRequestException("User not found");
      }

      if (user.role !== decodedToken.role) {
        throw new BadRequestException("Role mismatch");
      }

      // 5. Clean up 2FA session
      await Promise.all([
        this.cacheManager.del(REDIS_KEYS.TWO_FACTOR_TOKEN(decodedToken.id)),
        this.cacheManager.del(REDIS_KEYS.TWO_FACTOR_PENDING(decodedToken.id)),
        this.cacheManager.del(REDIS_KEYS.USER_KEY(decodedToken.id)),
      ]);

      // get current user request IP

      const currentIp = getCurrentUserIp(req);

      const isExistingIp = await this.userLoginIpsRepository.findOne({
        where: {
          userId: user.id,
          ipAddress: currentIp,
        },
      });

      if (!isExistingIp) {
        // FIXME: LOGIN from new IP :: SEND EMAIL TO APPROVE
        await this.userLoginIpsRepository.save(
          this.userLoginIpsRepository.create({
            userId: user.id,
            ipAddress: currentIp,
            isApproved: true, // Change it Later after Approvement
          }),
        );
      }

      // 6. Update last login info
      await this.usersRepository.update(user.id, {
        lastLoginAt: new Date(),
        lastLoginIp: currentIp,
      });

      // 7. Generate tokens and set cookies
      const payload: IAccessTokenPayload = {
        id: user.id,
        mobile: user.mobile,
        onboardingStatus: user.onboardingStatus,
        role: user.role,
        email: user.email,
      };

      const accessToken = this.generateAccessToken(payload);
      const refreshToken = this.generateRefreshToken(payload);

      // 8. Set cookies and clear verify token
      res.cookie(COOKIE_KEYS.ACCESS_TOKEN, accessToken, accessCookieOptions);
      res.cookie(COOKIE_KEYS.REFRESH_TOKEN, refreshToken, refreshCookieOptions);
      res.cookie(COOKIE_KEYS.VERIFY_TOKEN, "", {
        ...mobileVerifyCookieOptions,
        maxAge: 0,
      });

      // this.logger.info("2FA verification completed successfully");

      // 10. Return success response with tokens
      return {
        message: "Login successful",
        // accessToken,
        // refreshToken,
      };
    } catch (error) {
      this.logger.error(`2FA verification failed: ${error.message}`);
      throw error;
    }
  }

  async register(registerUserDto: RegisterUserDto, res: Response) {
    const { email, mobile, password, confirmPassword, firstName, lastName } =
      registerUserDto;

    if (password !== confirmPassword) {
      throw new BadRequestException(
        new MessageResponseDto("Password and confirm password do not match"),
      );
    }

    const existingUser = await this.usersRepository.findOne({
      where: [{ email }, { mobile }],
    });

    if (existingUser) {
      throw new BadRequestException(
        new MessageResponseDto(
          "User with this email or mobile number already exists",
        ),
      );
    }

    const hashedPassword = await this.bcryptService.hash(password);
    const fullName = `${firstName} ${lastName}`;

    const user = this.usersRepository.create({
      id: getUlidId(),
      email,
      mobile,
      password: hashedPassword,
      firstName,
      lastName,
      fullName,
      onboardingStatus: ONBOARDING_STATUS.SIGN_UP,
      role: USERS_ROLE.MERCHANT,
    });

    await this.usersRepository.save(user);

    return res
      .status(201)
      .json(new MessageResponseDto("User registered successfully"));
  }

  async registerByAdmin(registerUserDto: RegisterUserDto) {
    const { email, mobile, password, confirmPassword, firstName, lastName } =
      registerUserDto;

    if (password !== confirmPassword) {
      throw new BadRequestException(
        new MessageResponseDto("Password and confirm password do not match"),
      );
    }

    const existingUser = await this.usersRepository.findOne({
      where: [{ email }, { mobile }],
    });

    if (existingUser) {
      throw new BadRequestException(
        new MessageResponseDto(
          "User with this email or mobile number already exists",
        ),
      );
    }

    if (registerUserDto.channelPartnerId) {
      const existingChannelPartner = await this.usersRepository.exists({
        where: {
          role: USERS_ROLE.CHANNEL_PARTNER,
          id: registerUserDto.channelPartnerId,
        },
      });

      if (!existingChannelPartner) {
        throw new BadRequestException(
          new MessageResponseDto("Channel Partner Not Found"),
        );
      }
    }

    const hashedPassword = await this.bcryptService.hash(password);
    const fullName = `${firstName} ${lastName}`;

    const user = this.usersRepository.create({
      id: getUlidId(),
      email,
      mobile,
      password: hashedPassword,
      firstName,
      lastName,
      fullName,
      onboardingStatus: ONBOARDING_STATUS.SIGN_UP,
      role: USERS_ROLE.MERCHANT,
    });

    const savedUser = await this.usersRepository.save(user);

    const wallet = await this.walletRepository.save(
      this.walletRepository.create({
        user: savedUser,
      }),
    );

    savedUser.wallet = wallet;

    await this.usersRepository.save(savedUser);

    return new MessageResponseDto("User registered successfully");
  }

  async forgotPassword(contact: string, forgotPasswordDto: ForgotPasswordDto) {
    if (forgotPasswordDto.password !== forgotPasswordDto.confirmPassword) {
      throw new BadRequestException(
        new MessageResponseDto("Passwords do not match"),
      );
    }

    const isEmail = contact.includes("@");
    const existingUser = await this.usersRepository.findOne({
      where: isEmail
        ? { email: contact, accountStatus: ACCOUNT_STATUS.ACTIVE }
        : { mobile: contact, accountStatus: ACCOUNT_STATUS.ACTIVE },
      select: { password: true },
    });

    if (!existingUser) {
      throw new NotFoundException(
        new MessageResponseDto(
          "User not found or deactivated. Please contact support",
        ),
      );
    }

    const hashedPassword = await this.bcryptService.hash(
      forgotPasswordDto.password,
    );

    const updatedUser = this.usersRepository.create({
      password: hashedPassword,
    });

    await this.usersRepository.update(
      isEmail ? { email: contact } : { mobile: contact },
      updatedUser,
    );

    return new MessageResponseDto("Password changed successfully");
  }

  async sendForgotPasswordOtp({ email, mobile }: SendOtpDto, res: Response) {
    if (!email && !mobile) {
      throw new BadRequestException(
        new MessageResponseDto("Please provide email or mobile number"),
      );
    }

    const identifier = email ?? mobile!;
    const isEmailFlow = !!email;

    const user = await this.usersRepository.findOne({
      where: isEmailFlow ? { email } : { mobile },
    });

    if (!user) {
      throw new ConflictException(new MessageResponseDto("User doesn't exist"));
    }

    const otpKey = REDIS_KEYS.FORGET_PASSWORD_KEY(identifier);
    const otp = generateOtp();

    if (isEmailFlow) {
      const emailBody = `<p>Your Rupeeflow OTP to reset your password is: <strong>${otp}</strong></p><p>This code expires in 15 minutes.</p>`;
      const emailSent = await this.sesService.sendEmail(
        "Reset your Rupeeflow password",
        emailBody,
        user.email,
      );
      if (!emailSent?.success) {
        throw new BadRequestException(
          new MessageResponseDto("Failed to send OTP to your email"),
        );
      }
    } else {
      const formattedPhone = mobile!.startsWith("+") ? mobile! : `+91${mobile}`;
      const smsSent = await this.snsService.sendSMS(
        formattedPhone,
        `Your Rupeeflow OTP to reset your password is: ${otp}`,
      );
      if (!smsSent) {
        throw new BadRequestException(
          new MessageResponseDto("Failed to send mobile OTP"),
        );
      }
    }

    const payload: IVerifyMobilePayload = isEmailFlow
      ? { email: identifier, isVerified: false }
      : { mobile: identifier, isVerified: false };
    const token = this.generateAccessToken(payload, { expiresIn: "15m" });

    await this.cacheManager.set(
      otpKey,
      { otp, identifier, createdAt: Date.now() },
      1000 * 60 * 15,
    );

    return res
      .cookie(COOKIE_KEYS.MOBILE_INFO_KEY, token, mobileVerifyCookieOptions)
      .json({
        ...(isEmailFlow ? { email } : { mobile }),
        ...(!isProduction && { otp }),
      });
  }

  async logout(req: Request, res: Response, userId: string) {
    const { cookies } = req;
    for (const key in cookies) {
      if (!cookies.hasOwnProperty(key)) {
        continue;
      }
      res.cookie(key, "", { ...cookieOptions, maxAge: 0 });
    }

    await this.cacheManager.del(REDIS_KEYS.USER_KEY(userId)); // clear user cache

    return res.json(new MessageResponseDto("User logged out successfully"));
  }

  async sendOtp({ mobile }: SendOtpDto, res: Response) {
    const user = await this.usersRepository.findOne({
      where: {
        mobile,
      },
    });

    if (user) {
      throw new ConflictException(
        new MessageResponseDto("User already exists"),
      );
    }

    const existingOtp = await this.authOtpRepository.findOne({
      where: {
        mobile,
      },
    });

    const payload: IVerifyMobilePayload = {
      mobile,
      isVerified: false,
    };

    const token = this.generateAccessToken(payload, {
      expiresIn: "15m",
    });

    if (existingOtp) {
      // TODO: send otp via mobile

      return res
        .cookie(COOKIE_KEYS.MOBILE_INFO_KEY, token, mobileVerifyCookieOptions)
        .json({
          id: existingOtp.id,
          mobile,
          ...(!isProduction && { otp: existingOtp.code }),
        });
    }

    const otp = generateOtp();

    const authOtp = this.authOtpRepository.create({
      code: otp,
      mobile,
      expiredAt: new Date(Date.now() + 1000 * 60 * 15), // 15 minutes
    });

    const savedOtp = await this.authOtpRepository.save(authOtp);

    // TODO: send otp via mobile

    return res
      .cookie(COOKIE_KEYS.MOBILE_INFO_KEY, token, mobileVerifyCookieOptions)
      .json({
        id: savedOtp.id,
        mobile,
        ...(!isProduction && { otp }),
      });
  }

  async resendOtp({ mobile }: ReSendOtpDto, res: Response) {
    const authOtp = await this.authOtpRepository.findOne({
      where: {
        mobile,
      },
    });

    if (!authOtp) {
      throw new BadRequestException(new MessageResponseDto("OTP not found"));
    }

    const otp = generateOtp();

    const newOtp = this.authOtpRepository.create({
      code: otp,
      expiredAt: new Date(Date.now() + 1000 * 60 * 15), // 15 minutes
    });

    await this.authOtpRepository.update(authOtp.id, newOtp);

    // TODO: re-send otp via mobile

    const payload: IVerifyMobilePayload = {
      mobile,
      isVerified: false,
    };

    const token = this.generateAccessToken(payload, {
      expiresIn: "15m",
    });

    return res
      .cookie(COOKIE_KEYS.MOBILE_INFO_KEY, token, mobileVerifyCookieOptions)
      .json({
        id: newOtp.id,
        mobile,
        ...(!isProduction && { otp }),
      });
  }

  async verifyForgotPasswordOtp(
    { email, mobile, otp }: VerifyOtpDto,
    res: Response,
  ) {
    const identifier = email ?? mobile;
    if (!identifier) {
      throw new BadRequestException(
        new MessageResponseDto("Please provide email or mobile number"),
      );
    }

    const otpKey = REDIS_KEYS.FORGET_PASSWORD_KEY(identifier);
    const storedData = await this.cacheManager.get<{
      otp: string;
      identifier: string;
      createdAt: number;
    }>(otpKey);

    if (!storedData) {
      throw new BadRequestException(
        new MessageResponseDto("OTP has expired. Please request a new OTP"),
      );
    }

    if (storedData.otp !== otp) {
      throw new BadRequestException(new MessageResponseDto("Invalid OTP"));
    }

    await this.cacheManager.del(otpKey);

    const isEmail = storedData.identifier.includes("@");
    const payload: IVerifyMobilePayload = isEmail
      ? { email: storedData.identifier, isVerified: true }
      : { mobile: storedData.identifier, isVerified: true };

    const token = this.generateAccessToken(payload);

    return res
      .cookie(COOKIE_KEYS.MOBILE_INFO_KEY, token, mobileVerifyCookieOptions)
      .json(new MessageResponseDto("OTP verified successfully"));
  }

  async enable2FA(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    const updateResult = await this.usersRepository.update(userId, {
      twoFactorEnabled: true,
    });

    if (updateResult.affected === 0) {
      throw new BadRequestException(
        new MessageResponseDto("Failed to update 2FA status"),
      );
    }
    // Clear user cache
    await this.cacheManager.del(REDIS_KEYS.USER_KEY(userId));

    return new MessageResponseDto(
      `Two-factor authentication has been enabled successfully`,
    );
  }

  async update2FAStatusAdmin(userId: string, isEnabled: boolean) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    const updateResult = await this.usersRepository.update(userId, {
      twoFactorEnabled: isEnabled,
    });

    if (updateResult.affected === 0) {
      throw new BadRequestException(
        new MessageResponseDto("Failed to update 2FA status"),
      );
    }
    // Clear user cache
    await this.cacheManager.del(REDIS_KEYS.USER_KEY(userId));

    return new MessageResponseDto(
      `Two-factor authentication has been ${isEnabled ? "enabled" : "disabled"} successfully`,
    );
  }

  // private validateUserData(user: any): boolean {
  //   if (!user) return false;

  //   const requiredFields = ['id', 'mobile', 'onboardingStatus', 'role', 'email'];

  //   return requiredFields.every(field => {
  //     const hasField = field in user && user[field] !== null && user[field] !== undefined;
  //     if (!hasField) {
  //       // console.log(`Missing or invalid field: ${field}`);
  //     }

  //     return hasField;
  //   });
  // }

  // async verify2FA(token: string, req: Request, res: Response) {
  //   let decodedUserId: string;
  //   let user: any;

  //   console.log('Starting 2FA verification process');
  //   console.log('Input token:', token);
  //   console.log('Request cookies:', req.cookies);

  //   try {
  //     // Step 1: Get and verify token from cookie
  //     console.log('Step 1: Verifying cookie token');
  //     const verifyToken = req.cookies[COOKIE_KEYS.VERIFY_TOKEN];
  //     console.log('Verification token from cookie:', verifyToken);

  //     if (!verifyToken) {
  //       console.log('No verification token found in cookies');
  //       throw new BadRequestException(
  //         new MessageResponseDto('Invalid verification session. Please login again.'),
  //       );
  //     }
  //     // console.log('Verification token found in cookies')

  //     // Step 2: Decode and validate the token
  //     this.logger.debug('Step 2: Decoding JWT token');
  //     let decoded: IVerifyTokenPayload;
  //     try {
  //       decoded = this.jwtService.verify(verifyToken, { secret: accessTokenSecret }) as IVerifyTokenPayload;
  //       this.logger.debug('Decoded token:', decoded);

  //       if (!decoded || typeof decoded !== 'object') {
  //         this.logger.error('Invalid token format:', decoded);
  //         throw new BadRequestException(
  //           new MessageResponseDto('Invalid verification token format'),
  //         );
  //       }

  //       // Validate token has required fields
  //       if (!decoded.id || !decoded.role) {
  //         this.logger.error('Missing required fields in token:', decoded);
  //         throw new BadRequestException(
  //           new MessageResponseDto('Invalid token data'),
  //         );
  //       }

  //       this.logger.debug('Token successfully decoded and validated with fields:', {
  //         id: decoded.id,
  //         role: decoded.role,
  //         pending2FA: decoded.pending2FA
  //       });
  //     } catch (error) {
  //       this.logger.error('Token verification failed:', error);
  //       throw new BadRequestException(
  //         new MessageResponseDto('Invalid or expired verification token'),
  //       );
  //     }

  //     const typedDecoded = decoded as { id: string; pending2FA: boolean };
  //     if (!typedDecoded.pending2FA) {
  //       throw new BadRequestException(
  //         new MessageResponseDto('Invalid verification token - 2FA not pending'),
  //       );
  //     }

  //     decodedUserId = typedDecoded.id;
  //     if (!decodedUserId) {
  //       throw new BadRequestException(
  //         new MessageResponseDto('Invalid user ID in verification token'),
  //       );
  //     }

  //     // Step 3: Verify the 2FA token
  //     this.logger.debug('Step 3: Verifying 2FA token');
  //     this.logger.debug('Checking Redis for user:', { userId: decodedUserId });

  //     const [storedToken, isPending] = await Promise.all([
  //       this.cacheManager.get<string>(REDIS_KEYS.TWO_FACTOR_TOKEN(decodedUserId)),
  //       this.cacheManager.get<boolean>(REDIS_KEYS.TWO_FACTOR_PENDING(decodedUserId))
  //     ]);

  //     this.logger.debug('2FA verification:', {
  //       providedToken: token,
  //       storedToken,
  //       isPending,
  //       match: token === storedToken
  //     });

  //     if (!storedToken || !isPending) {
  //       this.logger.error('Invalid 2FA session:', { hasStoredToken: !!storedToken, isPending });
  //       throw new BadRequestException(
  //         new MessageResponseDto('Invalid or expired 2FA session'),
  //       );
  //     }

  //     // Get stored user data from Redis
  //     const storedUserData = await this.cacheManager.get<ICachedUserData>(REDIS_KEYS.USER_KEY(decodedUserId));
  //     this.logger.debug('Retrieved stored user data:', storedUserData);

  //     if (!storedUserData || !storedUserData.role) {
  //       this.logger.error('Missing user data in Redis:', {
  //         hasData: !!storedUserData,
  //         hasRole: storedUserData?.role
  //       });
  //     }

  //     this.logger.debug('2FA session validated successfully');

  //     console.log('Comparing tokens:', {
  //       provided: String(token),
  //       stored: String(storedToken)
  //     });

  //     if (String(token) !== String(storedToken)) {
  //       console.log('Token mismatch');
  //       throw new BadRequestException(
  //         new MessageResponseDto('Invalid 2FA code'),
  //       );
  //     }

  //     console.log('2FA token verified successfully');

  //     // Step 4: Get user data with all required fields
  //     this.logger.debug('Step 4: Fetching user data');
  //     this.logger.debug('Checking Redis for cached user data:', { userId: decodedUserId });

  //     // Validate decoded token has role
  //     if (!decoded.role) {
  //       this.logger.error('Role missing in verification token:', decoded);
  //       throw new BadRequestException(
  //         new MessageResponseDto('Invalid token: missing role'),
  //       );
  //     }

  //     this.logger.debug('Token decoded data:', {
  //       id: decoded.id,
  //       role: decoded.role,
  //       hasRole: 'role' in decoded
  //     });

  //     try {
  //       // First try to get user from Redis
  //       const cachedUser = await this.cacheManager.get<ICachedUserData>(REDIS_KEYS.USER_KEY(decodedUserId));
  //       console.log('Cached user data found:', !!cachedUser);

  //       if (cachedUser && this.validateUserData(cachedUser)) {
  //         console.log('Using valid cached user data');
  //         user = cachedUser;
  //       } else {
  //         this.logger.debug('No valid cached data, fetching fresh user data from database');
  //         user = await this.usersRepository.findOne({
  //           where: { id: decodedUserId },
  //           select: {
  //             id: true,
  //             mobile: true,
  //             onboardingStatus: true,
  //             role: true,
  //             email: true,
  //             twoFactorEnabled: true,
  //             firstName: true,
  //             lastName: true
  //           }
  //         });

  //         this.logger.debug('Retrieved user from database:', {
  //           id: user?.id,
  //           role: user?.role,
  //           email: user?.email
  //         });
  //         this.logger.debug('Database user data:', { id: user?.id, role: user?.role });

  //         if (!user) {
  //           console.log('No user found with ID:', decodedUserId);
  //           throw new BadRequestException(
  //             new MessageResponseDto('User not found'),
  //           );
  //         }

  //         if (!this.validateUserData(user)) {
  //           console.error('Invalid user data from database:', {
  //             id: user.id,
  //             hasRole: 'role' in user,
  //             role: user.role
  //           });
  //           throw new BadRequestException(
  //             new MessageResponseDto('Invalid user data'),
  //           );
  //         }

  //         // Cache the valid user data
  //         await this.cacheManager.set(REDIS_KEYS.USER_KEY(decodedUserId), user, 300); // 5 minutes TTL

  //       }

  //       console.log('User data validated successfully:', {
  //         id: user.id,
  //         role: user.role,
  //         hasRole: 'role' in user
  //       });
  //     } catch (error) {
  //       console.error('Error fetching/validating user data:', error);
  //       throw new BadRequestException(
  //         new MessageResponseDto('Error retrieving user data'),
  //       );
  //     }

  //     // Log user data for debugging
  //     this.logger.debug('Retrieved user data:', {
  //       id: user.id,
  //       role: user.role,
  //       email: user.email,
  //       mobile: user.mobile,
  //       onboardingStatus: user.onboardingStatus,
  //       firstName: user.firstName,
  //       lastName: user.lastName
  //     });

  //     // Verify all required fields are present
  //     const requiredFields = ['id', 'mobile', 'onboardingStatus', 'role', 'email'];
  //     for (const field of requiredFields) {
  //       if (user[field] === undefined || user[field] === null) {
  //         console.error(`Missing required field: ${field}`, {
  //           user,
  //           availableFields: Object.keys(user)
  //         });
  //         throw new BadRequestException(
  //           new MessageResponseDto(`Missing required user data: ${field}`)
  //         );
  //       }
  //     }

  //     // Step 5: Clean up 2FA session
  //     console.log('Step 5: Cleaning up 2FA session');
  //     try {
  //       await Promise.all([
  //         this.cacheManager.del(REDIS_KEYS.TWO_FACTOR_TOKEN(decodedUserId)),
  //         this.cacheManager.del(REDIS_KEYS.TWO_FACTOR_PENDING(decodedUserId))
  //       ]);
  //       console.log('2FA session cleanup completed');
  //     } catch (error) {
  //       console.error('Error cleaning up 2FA session:', error);
  //     }

  //     // Step 6: Update last login info
  //     console.log('Step 6: Updating last login info');
  //     try {
  //       await this.usersRepository.update(user.id, {
  //         lastLoginAt: new Date(),
  //         lastLoginIp: req.ip
  //       });
  //       console.log('Last login info updated successfully');
  //     } catch (error) {
  //       console.error('Error updating last login info:', error);
  //     }

  //     // Step 7: Generate tokens and set cookies
  //     this.logger.debug('Step 7: Generating tokens and setting cookies');

  //     // Validate role consistency
  //     if (!user.role) {
  //       this.logger.error('Role missing in user data before token generation');
  //       throw new BadRequestException(
  //         new MessageResponseDto('User role is missing')
  //       );
  //     }

  //     if (user.role !== decoded.role) {
  //       this.logger.error('Role mismatch between token and user:', {
  //         tokenRole: decoded.role,
  //         userRole: user.role
  //       });
  //       throw new BadRequestException(
  //         new MessageResponseDto('Invalid user role')
  //       );
  //     }

  //     this.logger.debug('User data for token generation:', {
  //       id: user.id,
  //       role: user.role,
  //       hasRole: 'role' in user
  //     });

  //     // Validate role before token generation
  //     if (!user.role) {
  //       this.logger.error('User role is missing before token generation');
  //       throw new BadRequestException(
  //         new MessageResponseDto('User role is missing'),
  //       );
  //     }
  //     this.logger.debug('User role validated:', user.role);

  //     console.log('Preparing token payload');
  //     const payload: IAccessTokenPayload = {
  //       id: user.id,
  //       mobile: user.mobile,
  //       onboardingStatus: user.onboardingStatus,
  //       role: user.role,
  //       email: user.email,
  //     };
  //     console.log('Token payload prepared:', { ...payload, email: '***' });

  //     console.log('Generating tokens');
  //     const accessToken = this.generateAccessToken(payload);
  //     const refreshToken = this.generateRefreshToken(payload);
  //     console.log('Tokens generated successfully');

  //     console.log('Setting cookies');
  //     res.clearCookie(COOKIE_KEYS.VERIFY_TOKEN);
  //     res.cookie(COOKIE_KEYS.ACCESS_TOKEN, accessToken, accessCookieOptions);
  //     res.cookie(COOKIE_KEYS.REFRESH_TOKEN, refreshToken, refreshCookieOptions);
  //     console.log('Cookies set successfully');

  //     console.log('2FA verification completed successfully');

  //     return {
  //       accessToken,
  //       refreshToken,
  //       message: 'Login successful'
  //     };

  //   } catch (error) {
  //     console.error('2FA verification error:', error);
  //     if (error instanceof BadRequestException) {
  //       throw error;
  //     }
  //     throw new BadRequestException(
  //       new MessageResponseDto('Error during 2FA verification'),
  //     );
  //   }
  // }

  async refreshToken(user: IRefreshTokenPayload, req: Request, res: Response) {
    const { email, id, mobile, onboardingStatus, role } = user;
    const userRaw = await this.usersRepository.findOne({
      where: {
        id,
      },
    });

    if (!userRaw) {
      const { cookies } = req;
      for (const key in cookies) {
        if (!cookies.hasOwnProperty(key)) {
          continue;
        }
        res.cookie(key, "", { maxAge: 0 });
      }

      return res.status(401).json(new MessageResponseDto("User not found"));
    }

    const accessToken = this.generateAccessToken({
      id,
      mobile,
      onboardingStatus,
      role,
      email,
    });

    return res
      .cookie(COOKIE_KEYS.ACCESS_TOKEN, accessToken, accessCookieOptions)
      .json(new MessageResponseDto("Token refreshed successfully"));
  }

  async sendSignupOtp(sendSignupOtpDto: SendSignupOtpDto) {
    const { email, mobile } = sendSignupOtpDto;

    const existingUser = await this.usersRepository.findOne({
      where: [{ mobile }, { email }],
    });

    if (existingUser) {
      throw new BadRequestException(
        new MessageResponseDto("User with this email or mobile already exists"),
      );
    }

    const mobileOtp = generateOtp();
    const emailOtp = generateOtp();

    const otpKey = REDIS_KEYS.OTP_KEY(mobile + email);

    const formattedPhone = mobile.startsWith("+") ? mobile : `+91${mobile}`;

    const smsSent = await this.snsService.sendSMS(
      formattedPhone,
      `Your Rupeeflow verification code is: ${mobileOtp}`,
    );

    if (!smsSent) {
      throw new BadRequestException(
        new MessageResponseDto("Failed to send mobile OTP"),
      );
    }

    const subject = `Let's verify your email with Rupeeflow!`;
    const body = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
              <div style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px;">
                Rupeeflow
              </div>
              <h2 style="color: #4CAF50; text-align: center;">Hey there,</h2>
              <p style="text-align: center;">Great to see you aboard! Let's quickly verify your email to get you started. Your verification code is:</p>
              <h3 style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; text-align: center;">${emailOtp}</h3>
              <p style="text-align: center;">Remember, this code is valid only for the next 10 minutes. We can't wait for you to explore all the amazing features we have to offer!</p>
              <p style="text-align: center; margin-top: 30px;">Regards,<br>Rupeeflow Support</p>
            </div>
          </body>
        </html>
      `;

    const emailSent = await this.sesService.sendEmail(subject, body, email);

    if (!emailSent.success) {
      throw new BadRequestException(
        new MessageResponseDto("Failed to send email OTP"),
      );
    }

    await this.cacheManager.set(
      otpKey,
      {
        mobileOtp,
        emailOtp,
        email,
        createdAt: Date.now(),
      },
      1000 * 60 * 15, // 15 minutes in seconds
    );

    return {
      message: "OTPs sent successfully",
      ...(!isProduction && { mobileOtp, emailOtp }),
    };
  }

  async verifyContact(
    verifyContactDto: VerifyContactDto,
    req: Request,
    res: Response,
  ) {
    const {
      firstName,
      lastName,
      email,
      mobile,
      password,
      confirmPassword,
      mobileOtp,
      emailOtp,
      termsAccepted,
    } = verifyContactDto;

    if (!termsAccepted) {
      throw new BadRequestException(
        new MessageResponseDto("Please accept terms and conditions"),
      );
    }

    if (password !== confirmPassword) {
      throw new BadRequestException(
        new MessageResponseDto("Passwords do not match"),
      );
    }

    const otpKey = REDIS_KEYS.OTP_KEY(mobile + email);

    try {
      const storedData = await this.cacheManager.get<{
        mobileOtp: string;
        emailOtp: string;
        email: string;
        createdAt: number;
      }>(otpKey);

      if (!storedData) {
        throw new BadRequestException(
          new MessageResponseDto("OTPs have expired. Please request new OTPs"),
        );
      }

      // Verify email matches
      if (storedData.email !== email) {
        throw new BadRequestException(
          new MessageResponseDto("Email does not match the one used for OTP"),
        );
      }

      // Verify mobile OTP
      if (storedData.mobileOtp !== mobileOtp) {
        await this.cacheManager.del(otpKey);
        throw new BadRequestException(
          new MessageResponseDto("Invalid mobile OTP"),
        );
      }

      // Verify email OTP
      if (storedData.emailOtp !== emailOtp) {
        await this.cacheManager.del(otpKey);
        throw new BadRequestException(
          new MessageResponseDto("Invalid email OTP"),
        );
      }

      // Create new user
      const hashedPassword = await this.bcryptService.hash(password);

      const newUser = this.usersRepository.create({
        firstName,
        lastName,
        email,
        mobile,
        password: hashedPassword,
        onboardingStatus: ONBOARDING_STATUS.SIGN_UP,
        role: USERS_ROLE.MERCHANT,
      });

      const user = await this.usersRepository.save(newUser);

      await this.walletRepository.save(this.walletRepository.create({ user }));

      // Clear OTPs from Redis after successful verification
      await this.cacheManager.del(otpKey);

      // Update last login info
      await this.usersRepository.update(user.id, {
        lastLoginAt: new Date(),
        lastLoginIp: req.ip,
      });

      const payload: IAccessTokenPayload = {
        id: user.id,
        mobile: user.mobile,
        onboardingStatus: user.onboardingStatus,
        role: user.role,
        email: user.email,
      };
      const accessToken = this.generateAccessToken(payload);
      const refreshToken = this.generateRefreshToken(payload);

      return res
        .cookie(COOKIE_KEYS.ACCESS_TOKEN, accessToken, accessCookieOptions)
        .cookie(COOKIE_KEYS.REFRESH_TOKEN, refreshToken, refreshCookieOptions)
        .json(new MessageResponseDto("Registration completed successfully"));
    } catch (error) {
      // Clean up Redis in case of any error
      await this.cacheManager.del(otpKey);
      throw error;
    }
  }

  generateAccessToken(payload: Record<string, any>, options?: JwtSignOptions) {
    return this.jwtService.sign(payload, {
      secret: accessTokenSecret,
      expiresIn: accessTokenExpiresIn,
      ...options,
    });
  }

  generateRefreshToken(payload: Record<string, any>, options?: JwtSignOptions) {
    return this.jwtService.sign(payload, {
      secret: refreshTokenSecret,
      expiresIn: refreshTokenExpiresIn,
      ...options,
    });
  }

  private async handleFailedLogin(identifier: string): Promise<number> {
    const attempts =
      (await this.cacheManager.get<number>(generateAttemptsKey(identifier))) ||
      0;
    const newAttempts = attempts + 1;
    const attemptsLeft = MAX_ATTEMPTS - newAttempts;

    if (newAttempts >= MAX_ATTEMPTS) {
      const lockEndTime = new Date(Date.now() + LOCK_TIME_MS);
      await this.cacheManager.set(
        generateLockAccountKey(identifier),
        lockEndTime.getTime(),
        LOCK_TIME_MS,
      );
      throw new BadRequestException(
        new MessageResponseDto(
          "Account locked due to multiple failed login attempts. Try again in 30 minutes.",
        ),
      );
    } else {
      await this.cacheManager.set(
        generateAttemptsKey(identifier),
        newAttempts,
        LOCK_TIME_MS,
      );
    }

    return attemptsLeft;
  }
}
