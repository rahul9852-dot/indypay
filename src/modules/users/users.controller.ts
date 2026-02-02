import {
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "express";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { WebhookUrlDto } from "./dto/webhook.dto";
import { UsersService } from "./users.service";
import { AddBusinessDetailsDto } from "./dto/add-business-details.dto";
import {
  GenerateClientSecretDto,
  GenerateClientSecretResponseDto,
} from "./dto/generate-client-secret.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ChangeStatusDto } from "./dto/change-status.dto";
import { ChangeRoleDto } from "./dto/change-role.dto";
import { UpdateCountDto } from "./dto/count.dto";
import {
  AddWhitelistIpsDto,
  DeleteWhitelistIpsDto,
  WhitelistIpsResponseDto,
} from "./dto/whitelist-ips.dto";
import { UserListQuery, UserListResponseDto } from "./dto/user-list.dto";
import { AddCredentialForFlakPayDto } from "./dto/add-credentials.dto";
import { AddAddressAdminDto, AddAddressDto } from "./dto/add-address.dto";
import { User } from "@/decorators/user.decorator";
import { MessageResponseDto, PaginationDto } from "@/dtos/common.dto";
import {
  ChangeOnboardingStatusDto,
  ResetPasswordDto,
  UserProfileResDto,
} from "@/modules/users/dto/user-profile.dto";
import { IgnoreBusinessDetails } from "@/decorators/ignore-business-details.decorator";
import { IgnoreKyc } from "@/decorators/ignore-kyc.decorator";
import { UsersEntity } from "@/entities/user.entity";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";
import { AuthGuard } from "@/guard/auth.guard";
import { ChangeRoleGuard } from "@/guard/change-role.guard";
import { ChangeAccountStatusGuard } from "@/guard/change-account-status.guard";

@ApiTags("Users")
@Controller({
  path: "users",
  version: "1",
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("user-ip/:userId")
  @Role(USERS_ROLE.OWNER, USERS_ROLE.ADMIN)
  async getUserIp(
    @Param("userId") userId: string,
    @Query() query: PaginationDto,
  ) {
    return this.usersService.getUserIps(userId, query);
  }

  @ApiOperation({
    summary: "Add Credential For FlakPay",
  })
  @Post("credentials/flakpay")
  @Role(USERS_ROLE.OWNER, USERS_ROLE.ADMIN)
  async addCredentialForFlakPay(
    @Body() addCredentialForFlakPayDto: AddCredentialForFlakPayDto,
  ) {
    return this.usersService.addCredentialForFlakPay(
      addCredentialForFlakPayDto,
    );
  }

  @ApiOperation({
    summary: "Get Credential For FalkPay",
  })
  @Get("credentials/flakpay/:userId")
  @Role(USERS_ROLE.OWNER, USERS_ROLE.ADMIN)
  async getCredentialForFalkPay(@Param("userId") userId: string) {
    return this.usersService.getCredentialForFalkPay(userId);
  }

  @ApiOperation({
    summary: "Add Address - Admin & OPS",
  })
  @Post("address/admin")
  @Role(USERS_ROLE.OWNER, USERS_ROLE.ADMIN, USERS_ROLE.OPS)
  async addAddressAdmin(@Body() { userId, ...rest }: AddAddressAdminDto) {
    return this.usersService.addUserAddress(userId, rest);
  }

  @UseGuards(ChangeRoleGuard)
  @Role(USERS_ROLE.OWNER, USERS_ROLE.ADMIN)
  @ApiOperation({ summary: "Change user onboarding status" })
  @Patch("change-onboarding-status")
  @HttpCode(HttpStatus.OK)
  async changeOnboardingStatus(
    @Body() changeOnboardingStatusDto: ChangeOnboardingStatusDto,
  ) {
    return this.usersService.changeOnboardingStatus(changeOnboardingStatusDto);
  }

  @ApiOperation({
    summary: "Get Address - Merchant",
  })
  @Get("address")
  @Role(USERS_ROLE.MERCHANT, USERS_ROLE.ADMIN, USERS_ROLE.VIEW_ONLY_ADMIN)
  async getAddress(@User() { id }: UsersEntity) {
    return this.usersService.getAddress(id);
  }
  @ApiOperation({
    summary: "Get Address - Admin & OPS",
  })
  @Get("address/:userId")
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OPS, USERS_ROLE.OWNER)
  async getAddressAdmin(@Param("userId") userId: string) {
    return this.usersService.getAddress(userId);
  }

  @ApiOperation({
    summary: "Add Address - Merchant",
  })
  @Post("address")
  @Role(USERS_ROLE.MERCHANT)
  async addAddress(
    @Body() addAddressDto: AddAddressDto,
    @User() { id }: UsersEntity,
  ) {
    return this.usersService.addUserAddress(id, addAddressDto);
  }

  @ApiOperation({
    summary: "Get All Merchants - Admin & OPS",
  })
  @Get("merchants")
  @Role(USERS_ROLE.OWNER, USERS_ROLE.ADMIN, USERS_ROLE.MERCHANT, USERS_ROLE.OPS)
  async getAllMerchants() {
    return this.usersService.getAllMerchants();
  }

  @ApiOperation({
    summary: "Get Users Client Id to confirm",
  })
  @Get("client-id/:userId")
  @Role(USERS_ROLE.OWNER, USERS_ROLE.MERCHANT)
  async getClientId(@Param("userId") userId: string) {
    return this.usersService.getClientId(userId);
  }

  @ApiOperation({
    summary: "Change Password",
  })
  @Post("change-password")
  @IgnoreKyc()
  @Role(
    USERS_ROLE.OWNER,
    USERS_ROLE.MERCHANT,
    USERS_ROLE.OPS,
    USERS_ROLE.ADMIN,
    USERS_ROLE.SALE,
    USERS_ROLE.GUEST,
    USERS_ROLE.CHANNEL_PARTNER,
  )
  @ApiOkResponse({ type: MessageResponseDto })
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @User() user: UsersEntity,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user, changePasswordDto);
  }

  @ApiOperation({ summary: "Generate api key - Admin only" })
  @Role(USERS_ROLE.OWNER, USERS_ROLE.ADMIN)
  @IgnoreKyc()
  @IgnoreBusinessDetails()
  @ApiCreatedResponse({ type: GenerateClientSecretResponseDto })
  @Post("admin/secret")
  async generateApiKey(
    @Body() generateClientSecretDto: GenerateClientSecretDto,
  ) {
    return this.usersService.generateClientIdAndClientSecret(
      generateClientSecretDto.mobile,
    );
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Generate api key for merchant" })
  @Role(USERS_ROLE.MERCHANT)
  @IgnoreKyc()
  @ApiCreatedResponse({ type: GenerateClientSecretResponseDto })
  @Post("secret")
  async createApiKey(@User() user: UsersEntity) {
    return this.usersService.generateClientIdAndClientSecret(user.mobile);
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Delete api key for merchant" })
  @Role(USERS_ROLE.MERCHANT, USERS_ROLE.OWNER, USERS_ROLE.ADMIN)
  @IgnoreKyc()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete("secret/:apiKeyId")
  async deleteApiKey(
    @Param("apiKeyId") apiKeyId: string,
    @User() user: UsersEntity,
  ) {
    return this.usersService.deleteApiKey(apiKeyId, user);
  }

  @ApiOperation({ summary: "Get user profile" })
  @IgnoreKyc()
  @ApiOkResponse({
    type: UserProfileResDto,
  })
  @Get("profile")
  async getUserProfile(@User() user: UsersEntity) {
    if ([USERS_ROLE.ADMIN, USERS_ROLE.OWNER].includes(user.role)) return user;
    else {
      const { jumpingCount: _, ...rest } = user;

      return rest;
    }
  }

  @ApiOperation({ summary: "Add business details" })
  @IgnoreKyc()
  @IgnoreBusinessDetails()
  @Post("business-details")
  @ApiCreatedResponse({
    type: MessageResponseDto,
  })
  updateBusinessDetails(
    @Body() addBusinessDetailsDto: AddBusinessDetailsDto,
    @User() user: UsersEntity,
    @Res() res: Response,
  ) {
    return this.usersService.addBusinessDetailsDto(
      addBusinessDetailsDto,
      user,
      res,
    );
  }

  @ApiOperation({ summary: "Get business details" })
  @IgnoreKyc()
  @IgnoreBusinessDetails()
  @Get("business-details")
  getBusinessDetails(@User() user: UsersEntity) {
    return this.usersService.getBusinessDetails(user);
  }

  // @ApiOperation({ summary: "Add bank details" })
  // @IgnoreKyc()
  // @IgnoreBusinessDetails()
  // @Role(USERS_ROLE.MERCHANT)
  // @Post("bank-details")
  // @ApiCreatedResponse({
  //   type: MessageResponseDto,
  // })
  // updateBankDetailsMerchant(
  //   @Body() addBankDetailsDto: AddBankDetailsDto,
  //   @User() user: UsersEntity,
  // ) {
  //   return this.usersService.addBankDetailsMerchant(addBankDetailsDto, user);
  // }

  @ApiOperation({ summary: "Get bank details" })
  @IgnoreKyc()
  @IgnoreBusinessDetails()
  @Role(USERS_ROLE.MERCHANT)
  @Get("bank-details")
  getBankDetailsMerchant(@User() user: UsersEntity) {
    return this.usersService.getBankDetailsMerchant(user.id);
  }
  @ApiOperation({ summary: "Get bank details by User Id - Admin" })
  @IgnoreKyc()
  @IgnoreBusinessDetails()
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Get("bank-details/:userId")
  getBankDetailsAdmin(@Param("userId") userId: string) {
    return this.usersService.getBankDetailsMerchant(userId);
  }

  // @ApiOperation({ summary: "Add/Update bank details - Admin, Owner" })
  // @IgnoreKyc()
  // @IgnoreBusinessDetails()
  // @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  // @Post("bank-details/admin")
  // @ApiOkResponse({
  //   type: MessageResponseDto,
  // })
  // @HttpCode(HttpStatus.OK)
  // updateBankDetailsAdmin(
  //   @Body() addBankDetailsAdminDto: AddBankDetailsAdminDto,
  // ) {
  //   return this.usersService.addBankDetailsAdmin(addBankDetailsAdminDto);
  // }

  @ApiOperation({ summary: "Delete user - Admin only" })
  @Delete("merchant/:id/admin")
  @Role(USERS_ROLE.OWNER, USERS_ROLE.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param("id") id: string) {
    return this.usersService.deleteUser(id);
  }

  @UseGuards(ChangeAccountStatusGuard)
  @ApiOperation({ summary: "Change account status - Admin only" })
  @Patch("merchant/status/admin")
  @Role(USERS_ROLE.OWNER, USERS_ROLE.ADMIN)
  @HttpCode(HttpStatus.OK)
  async changeAccountStatus(@Body() changeStatusDto: ChangeStatusDto) {
    return this.usersService.changeAccountStatus(changeStatusDto);
  }

  @UseGuards(ChangeRoleGuard)
  @Role(USERS_ROLE.OWNER, USERS_ROLE.ADMIN)
  @ApiOperation({ summary: "Change user role" })
  @Patch("change-role")
  @HttpCode(HttpStatus.OK)
  async changeUserRole(@Body() changeRoleDto: ChangeRoleDto) {
    return this.usersService.changeRole(changeRoleDto);
  }

  @ApiOperation({ summary: "Get users - Admin only" })
  @Role(USERS_ROLE.OWNER, USERS_ROLE.ADMIN)
  @IgnoreKyc()
  @IgnoreBusinessDetails()
  @ApiOkResponse({
    type: [UserProfileResDto],
  })
  @Get()
  async getUsers(@Query() query: PaginationDto) {
    return this.usersService.findAll(query);
  }

  @Get("api-key")
  @ApiOperation({
    summary: "Get api key",
  })
  @Role(USERS_ROLE.OWNER, USERS_ROLE.ADMIN, USERS_ROLE.MERCHANT)
  async getAllApiKeysMerchant(@User() user: UsersEntity) {
    return this.usersService.getAllApiKeysMerchant(user.id);
  }

  @Get("/api-key/:userId")
  @ApiOperation({
    summary: "Get api key",
  })
  @Role(USERS_ROLE.OWNER)
  async getAllApiKeysAdmin(@Param("userId") userId: string) {
    return this.usersService.getAllApiKeysMerchant(userId);
  }

  @ApiOperation({ summary: "Add whitelist ip - Admin only" })
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @IgnoreKyc()
  @IgnoreBusinessDetails()
  @ApiOkResponse({
    type: MessageResponseDto,
  })
  @Post("whitelist-ips/admin")
  async addWhitelistIp(@Body() addWhitelistIpsDto: AddWhitelistIpsDto) {
    return this.usersService.addWhitelistIps(
      addWhitelistIpsDto.userId,
      addWhitelistIpsDto.ipAddress,
    );
  }

  @ApiOperation({ summary: "Delete whitelist ip - Admin only" })
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @IgnoreKyc()
  @IgnoreBusinessDetails()
  @ApiOkResponse({
    type: MessageResponseDto,
  })
  @Delete("whitelist-ips/admin")
  async deleteWhitelistIp(
    @Body() deleteWhitelistIpsDto: DeleteWhitelistIpsDto,
  ) {
    return this.usersService.deleteWhitelistIps(deleteWhitelistIpsDto);
  }

  @ApiOperation({ summary: "Get whitelist IPs - Admin only" })
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @IgnoreKyc()
  @IgnoreBusinessDetails()
  @ApiOkResponse({
    type: [WhitelistIpsResponseDto],
  })
  @Get("whitelist-ips/admin/:userId")
  async getWhitelistIpsAdmin(@Param("userId") userId: string) {
    return this.usersService.getWhitelistIpsByUserId(userId);
  }

  // @ApiOperation({ summary: "Add whitelist IPs - Merchant only" })
  // @Role(USERS_ROLE.MERCHANT)
  // @IgnoreKyc()
  // @IgnoreBusinessDetails()
  // @ApiOkResponse({
  //   type: [WhitelistIpsResponseDto],
  // })
  // @Post("whitelist-ips")
  // async addWhitelistIpsMerchant(
  //   @User() { id }: UsersEntity,
  //   @Body() addWhitelistIpsMerchantDto: AddWhitelistIpsMerchantDto,
  // ) {
  //   return this.usersService.addWhitelistIps(
  //     id,
  //     addWhitelistIpsMerchantDto.ipAddress,
  //   );
  // }

  // @ApiOperation({ summary: "Delete whitelist IPs - Merchant only" })
  // @Role(USERS_ROLE.MERCHANT)
  // @IgnoreKyc()
  // @IgnoreBusinessDetails()
  // @ApiOkResponse({
  //   type: [WhitelistIpsResponseDto],
  // })
  // @Delete("whitelist-ips/:ipAddress")
  // async deleteWhitelistIpsMerchant(
  //   @User() { id }: UsersEntity,
  //   @Param("ipAddress") ipAddress: string,
  // ) {
  //   return this.usersService.deleteWhitelistIps({ userId: id, ipAddress });
  // }

  // @ApiOperation({ summary: "Get whitelist IPs - Merchant only" })
  // @Role(USERS_ROLE.MERCHANT)
  // @IgnoreKyc()
  // @IgnoreBusinessDetails()
  // @ApiOkResponse({
  //   type: [WhitelistIpsResponseDto],
  // })
  // @Get("whitelist-ips")
  // async getWhitelistIpsMerchant(@User() { id }: UsersEntity) {
  //   return this.usersService.getWhitelistIpsByUserId(id);
  // }

  @ApiOperation({ summary: "Update webhook url" })
  @Role(USERS_ROLE.MERCHANT)
  @IgnoreKyc()
  @ApiOkResponse({
    type: MessageResponseDto,
  })
  @Post("webhook-url")
  async addWebhookUrl(
    @Body() webhookUrlDto: WebhookUrlDto,
    @User() user: UsersEntity,
  ) {
    return this.usersService.updateWebhookUrl(user, webhookUrlDto);
  }

  @ApiOperation({ summary: "Get webhook url" })
  @Role(USERS_ROLE.MERCHANT)
  @IgnoreKyc()
  @ApiOkResponse({
    type: MessageResponseDto,
  })
  @Get("webhook-url")
  async getWebhookUrl(@User() user: UsersEntity) {
    return this.usersService.getWebhookUrl(user);
  }

  @ApiOperation({ summary: "Get list of users - Admin Only" })
  @ApiOkResponse({ type: UserListResponseDto })
  @Get("list")
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  async getAllUsers(@Query() query: UserListQuery) {
    return this.usersService.getPaginatedUsers(query);
  }

  @ApiOperation({ summary: "Get user by id - Admin Only" })
  @Get("list/:userId")
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  async getUserByUserId(@Param("userId") userId: string) {
    return this.usersService.getUserById(userId);
  }

  @ApiExcludeEndpoint()
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @IgnoreKyc()
  @Post("reset-password-admin")
  async resetPasswordAdmin(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.usersService.resetPassword(resetPasswordDto);
  }

  @ApiExcludeEndpoint()
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @IgnoreKyc()
  @Get("reset-cache-admin")
  async resetCacheAdmin() {
    return this.usersService.resetCache();
  }

  @ApiExcludeEndpoint()
  @Role(USERS_ROLE.OWNER)
  @IgnoreKyc()
  @IgnoreBusinessDetails()
  @Patch("count")
  async updateCount(@Body() updateCountDto: UpdateCountDto) {
    return this.usersService.updateCount(updateCountDto);
  }

  @ApiExcludeEndpoint()
  @Role(USERS_ROLE.OWNER)
  @IgnoreKyc()
  @IgnoreBusinessDetails()
  @Get("count/:userId")
  async getCount(@Param("userId") userId: string) {
    return this.usersService.getCount(userId);
  }
}
