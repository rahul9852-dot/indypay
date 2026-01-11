import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IntegrationMappingService } from "./integration-mapping.service";
import { UpdateUserIntegrationDto } from "./dto/update-user-integration.dto";
import { User } from "@/decorators/user.decorator";
import { UsersEntity } from "@/entities/user.entity";
import { AuthGuard } from "@/guard/auth.guard";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";
import { IntegrationEntity } from "@/entities/integration.entity";

@ApiTags("Integrations")
@Controller("integrations")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class IntegrationsController {
  constructor(
    private readonly integrationMappingService: IntegrationMappingService,
    @InjectRepository(IntegrationEntity)
    private readonly integrationRepository: Repository<IntegrationEntity>,
  ) {}

  @ApiOperation({ summary: "Get user's integration mapping" })
  @ApiOkResponse({ description: "User's integration mapping" })
  @Get("user/mapping")
  async getUserIntegrationMapping(@User() user: UsersEntity) {
    return this.integrationMappingService.getUserIntegrationMapping(user.id);
  }

  @ApiOperation({ summary: "Update user's integration mapping" })
  @ApiOkResponse({ description: "Integration mapping updated successfully" })
  @Put("user/mapping")
  async updateUserIntegration(
    @User() user: UsersEntity,
    @Body() updateDto: UpdateUserIntegrationDto,
  ) {
    return this.integrationMappingService.updateUserIntegration(
      user.id,
      updateDto.integrationCode,
    );
  }

  @ApiOperation({
    summary: "Get user's integration mapping (Admin/Ops only)",
  })
  @ApiOkResponse({ description: "User's integration mapping" })
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER, USERS_ROLE.OPS)
  @Get("user/:userId/mapping")
  async getUserIntegrationMappingByAdmin(@Param("userId") userId: string) {
    return this.integrationMappingService.getUserIntegrationMapping(userId);
  }

  @ApiOperation({
    summary: "Update user's integration mapping (Admin/Ops only)",
  })
  @ApiOkResponse({ description: "Integration mapping updated successfully" })
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER, USERS_ROLE.OPS)
  @Put("user/:userId/mapping")
  async updateUserIntegrationByAdmin(
    @Param("userId") userId: string,
    @Body() updateDto: UpdateUserIntegrationDto,
  ) {
    return this.integrationMappingService.updateUserIntegration(
      userId,
      updateDto.integrationCode,
    );
  }

  @ApiOperation({ summary: "Get all integrations" })
  @ApiOkResponse({ description: "List of all integrations" })
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER, USERS_ROLE.OPS)
  @Get()
  async getAllIntegrations() {
    return this.integrationRepository.find({
      order: { code: "ASC" },
    });
  }

  @ApiOperation({ summary: "Get integration by code" })
  @ApiOkResponse({ description: "Integration details" })
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER, USERS_ROLE.OPS)
  @Get(":code")
  async getIntegrationByCode(@Param("code") code: string) {
    return this.integrationRepository.findOne({
      where: { code: code.toUpperCase() },
    });
  }
}
