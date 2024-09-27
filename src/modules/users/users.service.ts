import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Response } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { AddBusinessDetailsDto } from "./dto/add-business-details.dto";
import { WebhookUrlDto } from "./dto/webhook.dto";
import { ChangeStatusDto } from "./dto/change-status.dto";
import { ChangeRoleDto } from "./dto/change-role.dto";
import { UsersEntity } from "@/entities/user.entity";
import { MessageResponseDto, PaginationDto } from "@/dtos/common.dto";
import { IAccessTokenPayload } from "@/interface/common.interface";
import {
  ACCOUNT_STATUS,
  COOKIE_KEYS,
  ONBOARDING_STATUS,
  USERS_ROLE,
} from "@/enums";
import {
  accessCookieOptions,
  refreshCookieOptions,
} from "@/utils/cookies.utils";
import { AuthService } from "@/modules/auth/auth.service";
import { UserApiKeysEntity } from "@/entities/user-api-key.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { BcryptService } from "@/shared/bcrypt/bcrypt.service";
import { decryptData } from "@/utils/encode-decode.utils";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(UserApiKeysEntity)
    private readonly userApiKeysRepository: Repository<UserApiKeysEntity>,
    private readonly authService: AuthService,
    private readonly bcryptService: BcryptService,
  ) {}

  async changePassword(
    user: IAccessTokenPayload,
    changePasswordDto: ChangePasswordDto,
  ) {
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException(
        new MessageResponseDto("Passwords do not match"),
      );
    }

    const existingUser = await this.usersRepository.findOne({
      where: {
        id: user.id,
        accountStatus: ACCOUNT_STATUS.ACTIVE,
      },
      select: {
        password: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException(
        new MessageResponseDto(
          "User not found or deactivated. Please contact support",
        ),
      );
    }

    const isPasswordValid = await this.bcryptService.compare(
      changePasswordDto.oldPassword,
      existingUser.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException(
        new MessageResponseDto("Incorrect old password"),
      );
    }

    const hashedPassword = await this.bcryptService.hash(
      changePasswordDto.newPassword,
    );

    const updatedUser = this.usersRepository.create({
      password: hashedPassword,
    });

    await this.usersRepository.update({ id: user.id }, updatedUser);

    return new MessageResponseDto("Password changed successfully");
  }

  async deleteApiKey(apiKeyId: string, user: UsersEntity) {
    const userApiKey = await this.userApiKeysRepository.findOne({
      where: { id: apiKeyId },
      relations: ["user"],
    });

    if (!userApiKey) {
      throw new NotFoundException(new MessageResponseDto("ApiKey not found"));
    }
    if (
      [USERS_ROLE.ADMIN, USERS_ROLE.OWNER].includes(user.role) ||
      userApiKey.user.id === user.id
    ) {
      {
        await this.userApiKeysRepository.delete(userApiKey.id);
      }
    } else {
      throw new ForbiddenException(new MessageResponseDto("Forbidden"));
    }
  }

  async generateClientIdAndClientSecret(mobile: string) {
    const user = await this.usersRepository.findOne({
      where: { mobile },
    });

    if (!user) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    const clientId = getUlidId("key");
    const clientSecret = getUlidId("sc");

    const userApiKey = this.userApiKeysRepository.create({
      user,
      clientId,
      clientSecret,
    });

    const savedUserApiKey = await this.userApiKeysRepository.save(userApiKey);

    return {
      id: savedUserApiKey.id,
      mobile: user.mobile,
      clientId,
      clientSecret,
    };
  }

  async getAllApiKeysMerchant(userId: string) {
    const userApiKeys = await this.userApiKeysRepository.find({
      where: { user: { id: userId } },
    });

    for (const userApiKey of userApiKeys) {
      userApiKey.clientSecret = await decryptData(userApiKey.clientSecret);
    }

    return userApiKeys;
  }

  async findAll({
    page = 1,
    limit = 10,
    search = "",
    sort = "id",
    order = "DESC",
  }: PaginationDto) {
    return this.usersRepository.find({
      where: {
        fullName: ILike(`%${search}%`),
      },
      skip: (page - 1) * limit,
      take: limit,
      order: {
        [sort]: order,
      },
    });
  }

  async findOne(userId: string) {
    return this.usersRepository.findOne({
      where: { id: userId },
      relations: ["businessDetails", "kyc"],
    });
  }

  async addBusinessDetailsDto(
    addBusinessDetailsDto: AddBusinessDetailsDto,
    reqUser: UsersEntity,
    res: Response,
  ) {
    const user = await this.usersRepository.findOne({
      where: {
        id: reqUser.id,
      },
      relations: ["businessDetails"],
    });

    if (!user) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    if (user.businessDetails) {
      throw new ConflictException(
        new MessageResponseDto("Business details already exists"),
      );
    }

    const userDetails = this.usersRepository.create({
      onboardingStatus: ONBOARDING_STATUS.FILLED_BUSINESS_DETAILS,
      businessDetails: addBusinessDetailsDto,
    });

    const savedUser = await this.usersRepository.save({
      ...userDetails,
      id: user.id,
    });

    const payload: IAccessTokenPayload = {
      id: user.id,
      mobile: user.mobile,
      onboardingStatus: savedUser.onboardingStatus,
      role: user.role,
      email: user.email,
    };
    const accessToken = this.authService.generateAccessToken(payload);
    const refreshToken = this.authService.generateRefreshToken(payload);

    res
      .cookie(COOKIE_KEYS.ACCESS_TOKEN, accessToken, accessCookieOptions)
      .cookie(COOKIE_KEYS.REFRESH_TOKEN, refreshToken, refreshCookieOptions)
      .json(new MessageResponseDto("Business details added successfully"));
  }

  async updateUser() {}

  async deleteUser(id: string) {
    const user = this.usersRepository.create({
      accountStatus: ACCOUNT_STATUS.DELETED,
    });

    await this.usersRepository.update({ id }, user);
  }

  async changeAccountStatus(changeStatusDto: ChangeStatusDto) {
    const { status: accountStatus, userId: id } = changeStatusDto;

    const dbUser = await this.usersRepository.findOne({
      where: { id },
    });

    if (!dbUser) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    const user = this.usersRepository.create({
      accountStatus,
    });

    await this.usersRepository.update({ id }, user);

    return new MessageResponseDto("Account status updated successfully");
  }

  async changeRole({ userId, role }: ChangeRoleDto) {
    const dbUser = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!dbUser) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    const user = this.usersRepository.create({
      role,
    });

    await this.usersRepository.update({ id: userId }, user);

    return new MessageResponseDto("Role updated successfully");
  }

  async findByMobile(mobile: string) {
    return this.usersRepository.findOneBy({ mobile });
  }

  async updateWebhookUrl({ id }: UsersEntity, webhookUrlDto: WebhookUrlDto) {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    const updatedUser = this.usersRepository.create({
      ...(webhookUrlDto.payInWebhookUrl && {
        payInWebhookUrl: webhookUrlDto.payInWebhookUrl,
      }),
      ...(webhookUrlDto.payOutWebhookUrl && {
        payOutWebhookUrl: webhookUrlDto.payOutWebhookUrl,
      }),
    });

    await this.usersRepository.update({ id }, updatedUser);

    return new MessageResponseDto("Webhook url updated successfully");
  }
}
