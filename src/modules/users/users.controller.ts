import {
  ApiCreatedResponse,
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
import { User } from "@/decorators/user.decorator";
import { IAccessTokenPayload } from "@/interface/common.interface";
import { MessageResponseDto, PaginationDto } from "@/dtos/common.dto";
import { UserProfileResDto } from "@/modules/users/dto/user-profile.dto";
import { IgnoreBusinessDetails } from "@/decorators/ignore-business-details.decorator";
import { IgnoreKyc } from "@/decorators/ignore-kyc.decorator";
import { UsersEntity } from "@/entities/user.entity";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";
import { AuthGuard } from "@/guard/auth.guard";
import { ChangeRoleGuard } from "@/guard/change-role.guard";

@ApiTags("Users")
@Controller({
  path: "users",
  version: "1",
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
  async getUserProfile(@User() user: IAccessTokenPayload) {
    return this.usersService.findOne(user.id);
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

  @ApiOperation({ summary: "Delete user - Admin only" })
  @Delete("merchant/:id/admin")
  @Role(USERS_ROLE.OWNER, USERS_ROLE.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param("id") id: string) {
    return this.usersService.deleteUser(id);
  }

  @ApiOperation({ summary: "Change account status - Admin only" })
  @Patch("merchant/status/admin")
  @Role(USERS_ROLE.OWNER, USERS_ROLE.ADMIN)
  @HttpCode(HttpStatus.OK)
  async changeAccountStatus(@Body() changeStatusDto: ChangeStatusDto) {
    return this.usersService.changeAccountStatus(changeStatusDto);
  }

  @UseGuards(ChangeRoleGuard)
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
    summary: "Get api key - Merchant",
  })
  async getAllApiKeysMerchant(@User() user: UsersEntity) {
    return this.usersService.getAllApiKeysMerchant(user.id);
  }

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
}
