import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Response } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { AddBusinessDetailsDto } from "./dto/add-business-details.dto";
import { WebhookUrlDto } from "./dto/webhook.dto";
import {
  ChangeOnboardingStatusDto,
  ResetPasswordDto,
} from "./dto/user-profile.dto";
import { ChangeStatusDto } from "./dto/change-status.dto";
import { ChangeRoleDto } from "./dto/change-role.dto";
import { AddAddressDto } from "./dto/add-address.dto";
import { DeleteWhitelistIpsDto } from "./dto/whitelist-ips.dto";
import { UserListQuery } from "./dto/user-list.dto";
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
import { decryptData, encryptData } from "@/utils/encode-decode.utils";
import { UserBankDetailsEntity } from "@/entities/user-bank-details.entity";
import { getPagination } from "@/utils/pagination.utils";
import { UserWhitelistIpsEntity } from "@/entities/user-whitelist-ip.entity";
import { UserAddressEntity } from "@/entities/user-address.entity";
import { REDIS_KEYS } from "@/constants/redis-cache.constant";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(UserApiKeysEntity)
    private readonly userApiKeysRepository: Repository<UserApiKeysEntity>,
    @InjectRepository(UserBankDetailsEntity)
    private readonly userBankDetailsRepository: Repository<UserBankDetailsEntity>,
    @InjectRepository(UserWhitelistIpsEntity)
    private readonly userWhitelistIpsRepository: Repository<UserWhitelistIpsEntity>,
    @InjectRepository(UserAddressEntity)
    private readonly addressEntity: Repository<UserAddressEntity>,

    @Inject(CACHE_MANAGER) private cacheManager: Cache,

    private readonly authService: AuthService,
    private readonly bcryptService: BcryptService,
  ) {}

  async changeOnboardingStatus({
    userId,
    onboardingStatus,
  }: ChangeOnboardingStatusDto) {
    const dbUser = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!dbUser) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }
    const user = this.usersRepository.create({
      onboardingStatus,
    });
    await this.usersRepository.update({ id: userId }, user);
    await this.cacheManager.del(REDIS_KEYS.USER_KEY(userId));

    return new MessageResponseDto("Onboarding status updated successfully");
  }

  async getBusinessDetails(user: UsersEntity) {
    return this.usersRepository.findOne({
      where: {
        id: user.id,
      },
      relations: {
        businessDetails: true,
      },
    });
  }

  async resetCache() {
    await this.cacheManager.reset();

    return new MessageResponseDto("Cache reset successfully");
  }

  async resetPassword({ userId, password, confirmPassword }: ResetPasswordDto) {
    if (password !== confirmPassword) {
      throw new BadRequestException(
        new MessageResponseDto("Password and confirm password do not match"),
      );
    }

    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    const hashedPassword = await this.bcryptService.hash(password);

    const updatedUser = this.usersRepository.create({
      password: hashedPassword,
    });

    await this.usersRepository.update(user.id, updatedUser);

    return new MessageResponseDto("Password reset successfully");
  }

  async getAddress(userId: string) {
    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
      },
      relations: {
        address: true,
      },
    });

    if (!user) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    if (!user.address) {
      throw new NotFoundException(new MessageResponseDto("Address not found"));
    }

    return user.address;
  }

  async addUserAddress(userId: string, addAddressDto: AddAddressDto) {
    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
      },
      relations: {
        address: true,
      },
    });

    if (!user) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    if (user.address) {
      throw new ConflictException(
        new MessageResponseDto("Address already exists"),
      );
    }

    const address = this.addressEntity.create({
      user,
      ...addAddressDto,
    });

    await this.addressEntity.save(address);

    return new MessageResponseDto("Address added successfully");
  }

  async getAllMerchants() {
    return this.usersRepository.find({
      where: {
        role: USERS_ROLE.MERCHANT,
      },
      select: {
        fullName: true,
        id: true,
      },
    });
  }

  /**
   * Changes the password of the user
   * @param user User object returned from the access token
   * @param changePasswordDto Object containing the old and new passwords
   * @returns MessageResponseDto containing the success message
   * @throws BadRequestException if the passwords do not match
   * @throws NotFoundException if the user is not found or deactivated
   * @throws BadRequestException if the old password is incorrect
   */
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

  /**
   * Deletes an API key of a user.
   * @param apiKeyId The id of the API key to be deleted.
   * @param user The user who is deleting the API key.
   * @throws {NotFoundException} If the API key is not found.
   * @throws {ForbiddenException} If the user is not allowed to delete the API key.
   */
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

  /**
   * Generates a client ID and client secret for a user, or updates an existing one if it already exists.
   * @param mobile The mobile number of the user.
   * @throws {NotFoundException} If the user is not found.
   * @returns An object with the user's mobile number, client ID, and client secret.
   * @example
   * {
   *   id: '01GB1QXN9QXQ2GZVQKJNYY0H0M',
   *   mobile: '+6598765432',
   *   clientId: '01GB1QXN9QXQ2GZVQKJNYY0H0M_key',
   *   clientSecret: '01GB1QXN9QXQ2GZVQKJNYY0H0M_sc',
   * }
   */
  async generateClientIdAndClientSecret(mobile: string) {
    const user = await this.usersRepository.findOne({
      where: { mobile },
    });

    if (!user) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    const existingUserApiKey = await this.userApiKeysRepository.findOne({
      where: { user: { id: user.id } },
    });

    const clientId = getUlidId("key");
    const clientSecret = getUlidId("sc");

    const encryptClientSecret = await encryptData(clientSecret);

    const userApiKey = this.userApiKeysRepository.create({
      user,
      clientId,
      clientSecret: encryptClientSecret,
      ...(existingUserApiKey && { id: existingUserApiKey.id }),
    });

    const savedUserApiKey = await this.userApiKeysRepository.save(userApiKey);

    await this.cacheManager.set(
      REDIS_KEYS.API_KEY(clientId),
      savedUserApiKey,
      1000 * 60 * 60 * 24 * 30,
    ); // 30 day

    return {
      id: savedUserApiKey.id,
      mobile: user.mobile,
      clientId,
      clientSecret,
    };
  }

  /**
   * Finds the API key for a merchant user by their ID.
   * @param userId The ID of the merchant user.
   * @throws {NotFoundException} If the user or their API key is not found.
   * @returns An object with the user's API key details.
   * @example
   * {
   *   id: '01GB1QXN9QXQ2GZVQKJNYY0H0M',
   *   clientId: 'key_01GB1QXN9QXQ2GZVQKJNYY0H0M',
   *   clientSecret: 'sc_01GB1QXN9QXQ2GZVQKJNYY0H0M',
   *   user: {
   *     id: 'usr_01GB1QXN9QXQ2GZVQKJNYY0H0M',
   *     mobile: '+6598765432',
   *     email: 'user@example.com',
   *     name: 'John Doe',
   *     role: 'MERCHANT',
   *   },
   * }
   */
  async getAllApiKeysMerchant(userId: string) {
    const userApiKeys = await this.userApiKeysRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!userApiKeys) {
      throw new NotFoundException(new MessageResponseDto("ApiKey not found"));
    }

    userApiKeys.clientSecret = await decryptData(userApiKeys.clientSecret);

    return userApiKeys;
  }

  /**
   * Finds all users with pagination and search.
   * @param page The page number.
   * @param limit The number of items per page.
   * @param search The search query.
   * @param sort The sort field.
   * @param order The order of the sort.
   * @returns An object with a `data` property that contains an array of users
   * and a `pagination` property that contains the pagination details.
   */
  async findAll({
    page = 1,
    limit = 10,
    search = "",
    sort = "id",
    order = "DESC",
  }: PaginationDto) {
    const [users, totalItems] = await this.usersRepository.findAndCount({
      where: {
        fullName: ILike(`%${search}%`),
      },
      relations: {
        channelPartner: true,
        businessDetails: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      order: {
        [sort]: order,
      },
    });

    const pagination = getPagination({
      totalItems,
      limit,
      page,
    });

    return {
      data: users,
      pagination,
    };
  }

  /**
   * Finds a user by ID.
   * @param userId The ID of the user to find.
   * @throws {NotFoundException} If the user is not found.
   * @returns The user with their business details and kyc.
   */
  async findOne(userId: string) {
    return this.usersRepository.findOne({
      where: { id: userId },
      relations: ["businessDetails", "kyc"],
    });
  }

  /**
   * Adds business details to the user.
   * @param addBusinessDetailsDto The business details to add.
   * @param reqUser The user who is adding the business details.
   * @param res The response to return.
   * @throws {NotFoundException} If the user is not found.
   * @throws {ConflictException} If the user's business details already exist.
   * @returns A JSON response with a message.
   */
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

  /**
   * Adds bank details for a merchant user
   * @param addBankDetailsDto Bank details to be added
   * @param reqUser The user requesting the addition of bank details
   * @throws NotFoundException if the user is not found
   * @throws ConflictException if the user already has bank details
   * @returns MessageResponseDto
   */
  // async addBankDetailsMerchant(
  //   addBankDetailsDto: AddBankDetailsDto,
  //   reqUser: UsersEntity,
  // ) {
  //   const user = await this.usersRepository.findOne({
  //     where: {
  //       id: reqUser.id,
  //     },
  //     relations: {
  //       bankDetails: true,
  //     },
  //   });

  //   if (!user) {
  //     throw new NotFoundException(new MessageResponseDto("User not found"));
  //   }

  //   const userDetails = this.usersRepository.create({
  //     bankDetails: addBankDetailsDto,
  //   });

  //   await this.usersRepository.save({
  //     ...userDetails,
  //     id: user.id,
  //   });

  //   return new MessageResponseDto("Bank details added successfully");
  // }

  /**
   * Get the bank details of a merchant
   * @param reqUser The user requesting the bank details
   * @returns The bank details of the user
   */
  async getBankDetailsMerchant(userId: string) {
    return this.userBankDetailsRepository.findOne({
      where: {
        user: { id: userId },
      },
    });
  }

  /**
   * Adds bank details to a user
   * @param addBankDetailsAdminDto The bank details to add
   * @returns A JSON response with a message
   * @throws {NotFoundException} If the user is not found
   * @throws {ConflictException} If the user's bank details already exist
   */
  // async addBankDetailsAdmin(addBankDetailsAdminDto: AddBankDetailsAdminDto) {
  //   const user = await this.usersRepository.findOne({
  //     where: {
  //       id: addBankDetailsAdminDto.userId,
  //     },
  //     relations: {
  //       bankDetails: true,
  //     },
  //   });

  //   if (!user) {
  //     throw new NotFoundException(new MessageResponseDto("User not found"));
  //   }

  //   const { userId, ...bankDetails } = addBankDetailsAdminDto;

  //   const userDetails = this.usersRepository.create({
  //     bankDetails,
  //   });

  //   await this.usersRepository.save({
  //     ...userDetails,
  //     id: userId,
  //   });

  //   return new MessageResponseDto(
  //     user.bankDetails
  //       ? "Bank details updated successfully"
  //       : "Bank details added successfully",
  //   );
  // }

  async updateUser() {}

  /**
   * Soft deletes a user with the given id
   * @param id The id of the user to delete
   * @returns The deleted user
   * @throws {NotFoundException} If the user is not found
   */
  async deleteUser(id: string) {
    const user = this.usersRepository.create({
      accountStatus: ACCOUNT_STATUS.DELETED,
    });

    await this.usersRepository.update({ id }, user);
  }

  /**
   * Changes the account status of a user
   * @param changeStatusDto An object with the user id and the new account status
   * @returns A message response with the result of the operation
   * @throws {NotFoundException} If the user is not found
   */
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

  /**
   * Changes the role of a user.
   * @param changeRoleDto An object with the user id and the new role.
   * @returns A message response with the result of the operation.
   * @throws {NotFoundException} If the user is not found.
   */
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

  /**
   * Finds a user by mobile number.
   * @param mobile The mobile number to search for.
   * @returns The user if found, otherwise null.
   */
  async findByMobile(mobile: string) {
    return this.usersRepository.findOneBy({ mobile });
  }

  /**
   * Adds an IP address to a user's whitelist.
   * @param userId The user's ID.
   * @param ipAddress The IP address to whitelist.
   * @throws NotFoundException If the user is not found.
   * @throws ConflictException If the IP address is already whitelisted.
   * @returns A message response indicating success.
   */
  async addWhitelistIps(userId: string, ipAddress: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    const isIpWhitelisted = await this.userWhitelistIpsRepository.exist({
      where: {
        ipAddress,
        user: { id: user.id },
      },
    });

    if (isIpWhitelisted) {
      throw new ConflictException(
        new MessageResponseDto("IP address already whitelisted"),
      );
    }

    const userWhitelistIps = this.userWhitelistIpsRepository.create({
      ipAddress,
      user,
    });

    await this.userWhitelistIpsRepository.save(userWhitelistIps);

    return new MessageResponseDto("IP address whitelisted successfully");
  }

  /**
   * Deletes an IP address from a user's whitelist.
   * @param userId The user's ID.
   * @param ipAddress The IP address to delete from the whitelist.
   * @throws NotFoundException If the user is not found.
   * @returns A message response indicating success.
   */
  async deleteWhitelistIps({ userId, ipAddress }: DeleteWhitelistIpsDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    await this.userWhitelistIpsRepository.delete({
      user: { id: user.id },
      ipAddress,
    });

    return new MessageResponseDto("IP address deleted successfully");
  }

  /**
   * Gets all IP addresses from a user's whitelist.
   * @param userId The user's ID.
   * @returns An array of IP addresses.
   */
  async getWhitelistIpsByUserId(userId: string) {
    return this.userWhitelistIpsRepository.find({
      where: {
        user: {
          id: userId,
        },
      },
    });
  }

  /**
   * Gets all IP addresses from a user's whitelist.
   * @param userId The user's ID.
   * @returns An array of IP addresses.
   */
  async getWhitelistIpsMerchant(userId: string) {
    return this.userWhitelistIpsRepository.find({
      where: {
        user: {
          id: userId,
        },
      },
    });
  }

  /**
   * Updates the webhook URLs for a user.
   * @param user The user object returned from the access token.
   * @param webhookUrlDto The object containing the new webhook URLs.
   * @returns A MessageResponseDto containing the success message.
   * @throws NotFoundException if the user is not found.
   */
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

  /**
   * Retrieves the webhook URLs for a user.
   * @param user The user object returned from the access token.
   * @returns The user object with the webhook URLs.
   * @throws NotFoundException if the user is not found.
   */
  async getWebhookUrl({ id }: UsersEntity) {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: {
        id: true,
        payInWebhookUrl: true,
        payOutWebhookUrl: true,
      },
    });

    return user;
  }

  /**
   * Finds the client ID for a user by their ID.
   * @param userId The ID of the user to find.
   * @throws {NotFoundException} If the user is not found.
   * @returns An array of objects with the client ID, createdAt, updatedAt,
   *          and the user's full name.
   */
  async getClientId(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(new MessageResponseDto("User not found"));
    }

    const userApiKey = await this.userApiKeysRepository.find({
      where: { user: { id: user.id } },
      select: {
        clientId: true,
        createdAt: true,
        updatedAt: true,
        user: {
          fullName: true,
        },
      },
      relations: {
        user: true,
      },
    });

    return userApiKey;
  }

  async getPaginatedUsers(query: UserListQuery) {
    const {
      page = 1,
      limit = 10,
      search = "",
      role,
      order = "ASC",
      sort = "id",
    } = query;

    let roleInDb = 2;

    switch (role) {
      case "merchant":
        roleInDb = 2;
        break;
      case "cp":
        roleInDb = 3;
        break;
      case "ops":
        roleInDb = 4;
        break;
    }

    const [users, total] = await this.usersRepository.findAndCount({
      where: search
        ? { fullName: ILike(`%${search}%`), role: roleInDb }
        : {
            role: roleInDb,
          },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobile: true,
        role: true,
        onboardingStatus: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true,
      },
      take: limit,
      skip: (page - 1) * limit,
      order: { [sort]: order },
    });

    const pagination = getPagination({
      totalItems: total,
      page,
      limit,
    });

    return {
      data: users,
      pagination,
    };
  }
}
