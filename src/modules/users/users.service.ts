import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { FindManyOptions, ILike, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { Response } from "express";

import {
  CreateUserDto,
  UpdateBusinessDetailsDto,
  UpdateUserDto,
} from "./users.dto";
import { UsersEntity } from "@/entities/users.entity";
import { COOKIE_KEYS, ID_TYPE, ONBOARDING_STATUS } from "@/enums";
import { MessageResponseDto, PaginationDto } from "@/dtos/common.dto";
import { BusinessDetailsEntity } from "@/entities/business-details.entity";
import {
  accessCookieOptions,
  refreshCookieOptions,
} from "@/utils/cookies.utils";
import { appConfig } from "@/config/app.config";

const {
  jwtConfig: {
    accessTokenExpiresIn,
    accessTokenSecret,
    refreshTokenExpiresIn,
    refreshTokenSecret,
  },
} = appConfig();

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly _usersRepository: Repository<UsersEntity>,
    @InjectRepository(BusinessDetailsEntity)
    private readonly _businessDetailsRepository: Repository<BusinessDetailsEntity>,

    private readonly _jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto, businessDetailsId: string) {
    const userExists = await this.findByEmail(createUserDto.email);
    const mobileExists = await this.findByMobile(createUserDto.mobile);
    if (userExists || mobileExists) {
      throw new BadRequestException(
        new MessageResponseDto("User already exists"),
      );
    }

    const user = this._usersRepository.create({
      ...createUserDto,
      businessDetailsId,
    });

    return this._usersRepository.save(user);
  }

  async findById(userId: string) {
    if (!userId.startsWith(ID_TYPE.USER)) {
      return null;
    }

    return this._usersRepository.findOne({
      where: { id: userId },
      relations: ["businessDetails"],
    });
  }

  async findByEmail(userEmail: string) {
    return this._usersRepository.findOne({
      where: { email: userEmail },
      relations: ["businessDetails"],
    });
  }

  async findByMobile(userMobile: string) {
    return this._usersRepository.findOne({
      where: { mobile: userMobile },
      relations: ["businessDetails"],
    });
  }

  async update(userId: string, updateUserDto: UpdateUserDto) {
    if (!userId.startsWith(ID_TYPE.USER)) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    const user = this._usersRepository.create({ id: userId, ...updateUserDto });

    const savedUser = await this._usersRepository.save(user);

    if (!savedUser) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    return new MessageResponseDto("User updated successfully");
  }

  async softDelete(userId: string) {
    if (!userId.startsWith(ID_TYPE.USER)) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    const user = await this._usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    return this._usersRepository.softRemove(user);
  }

  async restore(userId: string) {
    if (!userId.startsWith(ID_TYPE.USER)) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    const user = await this._usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    return this._usersRepository.restore(user.id);
  }

  async delete(userId: string) {
    if (!userId.startsWith(ID_TYPE.USER)) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    const user = await this._usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    return this._usersRepository.remove(user);
  }

  async update2FA({
    email,
    is2FAEnabled,
    secret2FA,
  }: {
    email: string;
    is2FAEnabled: boolean;
    secret2FA?: string;
  }) {
    if (is2FAEnabled && !secret2FA) {
      throw new BadRequestException(
        new MessageResponseDto("2FA secret is required to enable 2FA"),
      );
    }
    const newUser = this._usersRepository.create({
      is2FAEnabled,
      secret2FA,
    });

    return this._usersRepository.update({ email }, newUser);
  }

  async getAll({
    limit = 10,
    order = "ASC",
    page = 1,
    search = "",
    sort = "id",
  }: PaginationDto) {
    const options: FindManyOptions<UsersEntity> = {
      where: {
        ...(search && {
          fullName: ILike(`%${search}%`),
        }),
      },
      take: limit,
      skip: limit * (page - 1),
      order: {
        [sort]: order,
      },
      relations: ["businessDetails"],
    };

    return this._usersRepository.find(options);
  }

  async updateBusinessDetails(
    businessDetailsDto: UpdateBusinessDetailsDto,
    response: Response,
  ) {
    const { email } = businessDetailsDto;

    const user = await this.findByEmail(email);

    if (!user) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    const oldBusinessDetails = await this._businessDetailsRepository.findOneBy({
      user: {
        email,
      },
    });

    if (!oldBusinessDetails) {
      throw new NotFoundException(
        new MessageResponseDto("Business details not found"),
      );
    }

    const createBusinessDetails = this._businessDetailsRepository.create({
      ...businessDetailsDto,
      id: oldBusinessDetails.id,
    });

    await this._businessDetailsRepository.update(
      oldBusinessDetails.id,
      createBusinessDetails,
    );

    const createdUser = this._usersRepository.create({
      id: user.id,
      onboardingStatus: ONBOARDING_STATUS.FILLED_BUSINESS_DETAILS,
    });

    await this._usersRepository.update(user.id, createdUser);

    const accessToken = this.generateAccessToken({
      id: oldBusinessDetails.id,
      email,
    });

    const refreshToken = this.generateRefreshToken({
      id: oldBusinessDetails.id,
      email,
    });

    response
      .cookie(COOKIE_KEYS.ACCESS_TOKEN, accessToken, accessCookieOptions)
      .cookie(COOKIE_KEYS.REFRESH_TOKEN, refreshToken, refreshCookieOptions)
      .json(new MessageResponseDto("Business details updated successfully"));
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
