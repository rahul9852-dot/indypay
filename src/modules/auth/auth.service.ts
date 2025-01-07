import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Inject,
} from "@nestjs/common";
import { Request, Response } from "express";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { ReSendOtpDto, SendOtpDto, VerifyOtpDto } from "./dto/send-otp.dto";
import { RegisterUserDto } from "./dto/register-user.dto";
import { LoginUserDto } from "./dto/login-user.dto";
import { VerifyContactDto } from "./dto/verify-contact.dto";
import { SendSignupOtpDto } from "./dto/send-signup-otp.dto";
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
import { COOKIE_KEYS } from "@/enums";
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

const {
  jwtConfig: {
    accessTokenExpiresIn,
    accessTokenSecret,
    refreshTokenExpiresIn,
    refreshTokenSecret,
  },
  isProduction,
} = appConfig();

interface StoredOtps {
  mobileOtp: string;
  emailOtp: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(AuthOtpEntity)
    private readonly authOtpRepository: Repository<AuthOtpEntity>,

    private readonly bcryptService: BcryptService,
    private readonly jwtService: JwtService,
    private readonly snsService: SNSService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async login(loginUserDto: LoginUserDto, res: Response) {
    const isLocked = await this.cacheManager.get<number>(
      generateLockAccountKey(loginUserDto.mobile),
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
        mobile: loginUserDto.mobile,
      },
      select: ["password", "id", "mobile", "onboardingStatus", "role", "email"],
    });

    if (!user) {
      throw new BadRequestException(
        new MessageResponseDto("Incorrect mobile number or password"),
      );
    }

    const isPasswordValid = await this.bcryptService.compare(
      loginUserDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      const attemptsLeft = await this.handleFailedLogin(loginUserDto.mobile);
      throw new BadRequestException(
        new MessageResponseDto(
          `Incorrect mobile number or password. ${attemptsLeft} attempts left.`,
        ),
      );
    }

    await this.cacheManager.del(generateAttemptsKey(loginUserDto.mobile));

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
      .json(new MessageResponseDto("User logged in successfully"));
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

    await this.usersRepository.save(user);

    return new MessageResponseDto("User registered successfully");
  }

  forgotPassword() {
    return;
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

  async verifyOtp({ mobile, otp }: VerifyOtpDto, res: Response) {
    const authOtp = await this.authOtpRepository.findOne({
      where: {
        mobile,
        code: otp,
      },
    });

    if (!authOtp) {
      throw new BadRequestException(
        new MessageResponseDto("Invalid or expired OTP"),
      );
    }

    if (authOtp.expiredAt < new Date()) {
      throw new BadRequestException(
        new MessageResponseDto("Invalid or expired OTP"),
      );
    }

    await this.authOtpRepository.delete(authOtp.id);

    const payload: IVerifyMobilePayload = {
      mobile,
      isVerified: true,
    };

    const token = this.generateAccessToken(payload, {
      expiresIn: "15m",
    });

    return res
      .cookie(COOKIE_KEYS.MOBILE_INFO_KEY, token, mobileVerifyCookieOptions)
      .json(new MessageResponseDto("OTP verified successfully"));
  }

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

    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: [{ mobile }, { email }],
    });

    if (existingUser) {
      throw new BadRequestException(
        new MessageResponseDto("User with this email or mobile already exists"),
      );
    }

    // Generate OTPs
    const mobileOtp = generateOtp();
    const emailOtp = generateOtp();

    const otpKey = REDIS_KEYS.OTP_KEY(mobile + email);

    // Format phone number for SNS
    const formattedPhone = mobile.startsWith("+") ? mobile : `+91${mobile}`;

    // Send OTP via SMS
    const smsSent = await this.snsService.sendSMS(
      formattedPhone,
      `Your PayBolt verification code is: ${mobileOtp}`,
    );

    if (!smsSent) {
      throw new BadRequestException(
        new MessageResponseDto("Failed to send mobile OTP"),
      );
    }

    // Store both OTPs in Redis with 15 minutes expiry
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

    // FIXME: Implement email OTP sending here
    // await this.emailService.sendOtp(email, emailOtp);

    return {
      message: "OTPs sent successfully",
      ...(!isProduction && { mobileOtp, emailOtp }),
    };
  }

  async verifyContact(verifyContactDto: VerifyContactDto, res: Response) {
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

      // Clear OTPs from Redis after successful verification
      await this.cacheManager.del(otpKey);

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

  private async handleFailedLogin(mobile: string): Promise<number> {
    const attempts =
      (await this.cacheManager.get<number>(generateAttemptsKey(mobile))) || 0;
    const newAttempts = attempts + 1;
    const attemptsLeft = MAX_ATTEMPTS - newAttempts;

    if (newAttempts >= MAX_ATTEMPTS) {
      const lockEndTime = new Date(Date.now() + LOCK_TIME_MS);
      await this.cacheManager.set(
        generateLockAccountKey(mobile),
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
        generateAttemptsKey(mobile),
        newAttempts,
        LOCK_TIME_MS,
      );
    }

    return attemptsLeft;
  }
}
