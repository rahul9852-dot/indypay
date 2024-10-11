import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { Request, Response } from "express";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { ReSendOtpDto, SendOtpDto, VerifyOtpDto } from "./dto/send-otp.dto";
import { RegisterUserDto } from "./dto/register-user.dto";
import { LoginUserDto } from "./dto/login-user.dto";
import { UsersEntity } from "@/entities/user.entity";
import { BcryptService } from "@/shared/bcrypt/bcrypt.service";
import { MessageResponseDto } from "@/dtos/common.dto";
import { appConfig } from "@/config/app.config";
import {
  accessCookieOptions,
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
import { generateOtp } from "@/utils/helperFunctions.utils";

const {
  jwtConfig: {
    accessTokenExpiresIn,
    accessTokenSecret,
    refreshTokenExpiresIn,
    refreshTokenSecret,
  },
  isProduction,
} = appConfig();

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(AuthOtpEntity)
    private readonly authOtpRepository: Repository<AuthOtpEntity>,

    private readonly bcryptService: BcryptService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginUserDto: LoginUserDto, res: Response) {
    const user = await this.usersRepository.findOne({
      where: {
        mobile: loginUserDto.mobile,
      },
      select: ["password", "id", "mobile", "onboardingStatus", "role", "email"],
    });

    if (!user) {
      throw new BadRequestException(
        new MessageResponseDto("Incorrect mobile or password"),
      );
    }

    const isPasswordValid = await this.bcryptService.compare(
      loginUserDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException(
        new MessageResponseDto("Incorrect mobile or password"),
      );
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

    return res
      .cookie(COOKIE_KEYS.ACCESS_TOKEN, accessToken, accessCookieOptions)
      .cookie(COOKIE_KEYS.REFRESH_TOKEN, refreshToken, refreshCookieOptions)
      .json(new MessageResponseDto("User logged in successfully"));
  }

  async register(registerUserDto: RegisterUserDto, res: Response) {
    if (registerUserDto.password !== registerUserDto.confirmPassword) {
      throw new BadRequestException(
        new MessageResponseDto("Passwords do not match"),
      );
    }

    const existingUser = await this.usersRepository.exists({
      where: {
        mobile: registerUserDto.mobile,
      },
    });

    const existingEmail = await this.usersRepository.exists({
      where: {
        email: registerUserDto.email,
      },
    });

    if (existingUser || existingEmail) {
      throw new ConflictException(
        new MessageResponseDto("User already exists"),
      );
    }

    const hashedPassword = await this.bcryptService.hash(
      registerUserDto.password,
    );

    const newUser = this.usersRepository.create({
      ...registerUserDto,
      password: hashedPassword,
    });

    const user = await this.usersRepository.save(newUser);

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
      .cookie(COOKIE_KEYS.MOBILE_INFO_KEY, "", { maxAge: 0 })
      .cookie(COOKIE_KEYS.ACCESS_TOKEN, accessToken, accessCookieOptions)
      .cookie(COOKIE_KEYS.REFRESH_TOKEN, refreshToken, refreshCookieOptions)
      .json(new MessageResponseDto("User registered successfully"));
  }

  async registerByAdmin(registerUserDto: RegisterUserDto) {
    if (registerUserDto.password !== registerUserDto.confirmPassword) {
      throw new BadRequestException(
        new MessageResponseDto("Passwords do not match"),
      );
    }

    const existingUser = await this.usersRepository.exists({
      where: {
        mobile: registerUserDto.mobile,
      },
    });

    const existingUserEmail = await this.usersRepository.exists({
      where: {
        email: registerUserDto.email,
      },
    });

    if (existingUser || existingUserEmail) {
      throw new ConflictException(
        new MessageResponseDto("User already exists"),
      );
    }

    const hashedPassword = await this.bcryptService.hash(
      registerUserDto.password,
    );

    const newUser = this.usersRepository.create({
      ...registerUserDto,
      password: hashedPassword,
    });

    return await this.usersRepository.save(newUser);
  }

  forgotPassword() {
    return;
  }

  logout(req: Request, res: Response) {
    const { cookies } = req;
    for (const key in cookies) {
      if (!cookies.hasOwnProperty(key)) {
        continue;
      }
      res.cookie(key, "", { maxAge: 0 });
    }

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

    const otp = generateOtp();

    const authOtp = this.authOtpRepository.create({
      code: otp,
      mobile,
      expiredAt: new Date(Date.now() + 1000 * 60 * 15), // 15 minutes
    });

    const savedOtp = await this.authOtpRepository.save(authOtp);

    // TODO: send otp via mobile

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
}
