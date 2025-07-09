import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ChannelPartnersService } from "./channel-partners.service";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";
import {
  DateDto,
  PaginationDto,
  PaginationWithDateDto,
} from "@/dtos/common.dto";
import { User } from "@/decorators/user.decorator";
import { UsersEntity } from "@/entities/user.entity";
import { AnalyticsService } from "@/modules/analytics/analytics.service";

@ApiTags("Channel Partners")
@Role(USERS_ROLE.CHANNEL_PARTNER)
@Controller("cp")
export class ChannelPartnersController {
  constructor(
    private readonly channelPartnersService: ChannelPartnersService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get("merchants")
  @ApiOperation({ summary: "Get all merchants" })
  async getAllMerchants(
    @Query() paginationDto: PaginationDto,
    @User() { id }: UsersEntity,
  ) {
    return this.channelPartnersService.getAllMerchants(paginationDto, id);
  }

  @Get("merchants/:userId")
  @ApiOperation({ summary: "Get merchant by id" })
  async getMerchantById(
    @Param("userId") userId: string,
    @User() { id }: UsersEntity,
  ) {
    return this.channelPartnersService.getMerchantByIdCP(userId, id);
  }

  @Get("collections")
  @ApiOperation({ summary: "Get all collections" })
  async getAllCollectionsGroupByUserCP(
    @Query() paginationDto: PaginationDto,
    @User() { id }: UsersEntity,
  ) {
    return this.channelPartnersService.getAllCollectionsGroupByUserCP(
      paginationDto,
      id,
    );
  }

  @Get("collections/:payinId")
  @ApiOperation({ summary: "Get collection by id" })
  async getCollectionByIdCP(
    @Param("payinId") payinId: string,
    @User() { id }: UsersEntity,
  ) {
    return this.channelPartnersService.getCollectionByIdCP(payinId, id);
  }

  @Get("collections/merchants/:userId")
  @ApiOperation({ summary: "Get all collections by merchant id" })
  async getAllCollectsByMerchantIdCP(
    @Param("userId") userId: string,
    @Query() dateDto: DateDto,
    @Query() paginationDto: PaginationDto,
    @User() { id }: UsersEntity,
  ) {
    return this.channelPartnersService.getAllCollectsByMerchantIdCP(
      paginationDto,
      dateDto,
      userId,
      id,
    );
  }

  @Get("stats")
  @ApiOperation({ summary: "Get stats" })
  async getStatsForCP(@User() { id }: UsersEntity, @Query() query: DateDto) {
    return this.channelPartnersService.getStatsForCP(id, query);
  }

  @Get("business-trend")
  @ApiOperation({ summary: "Get channel partner's business trend analytics" })
  @Role(USERS_ROLE.CHANNEL_PARTNER)
  async getCPBusinessTrend(
    @User() { id }: UsersEntity,
    @Query() dateDto: DateDto,
  ) {
    return {
      data: await this.channelPartnersService.getBusinessTrendForCP(
        id,
        dateDto,
      ),
    };
  }

  @Get("conversion-rate")
  @ApiOperation({
    summary: "Get conversion rate analytics for Channel Partner",
  })
  @Role(USERS_ROLE.CHANNEL_PARTNER)
  async getCPConversionRate(
    @User() { id }: UsersEntity,
    @Query() dateDto: DateDto,
  ) {
    return this.analyticsService.getAdminConversionRate(dateDto, id);
  }

  @Get("failure")
  @ApiOperation({ summary: "Get failure analytics for channel partner" })
  @Role(USERS_ROLE.CHANNEL_PARTNER)
  async getCPFailureAnalytics(
    @User() { id }: UsersEntity,
    @Query() dateDto: DateDto,
  ) {
    return this.analyticsService.getAdminFailureAnalytics(dateDto, id);
  }

  @Get("success")
  @ApiOperation({ summary: "Get success analytics for channel partner" })
  @Role(USERS_ROLE.CHANNEL_PARTNER)
  async getCPSuccessAnalytics(
    @User() { id }: UsersEntity,
    @Query() dateDto: DateDto,
  ) {
    return this.analyticsService.getAdminSuccessAnalytics(dateDto, id);
  }

  @Get("settlements")
  @ApiOperation({ summary: "Get settlements" })
  async getSettlementsForCP(
    @Query() paginationDto: PaginationWithDateDto,
    @User() user: UsersEntity,
  ) {
    return this.channelPartnersService.findAllSettlementsTransactionsCP(
      paginationDto,
      user,
    );
  }

  @Get("settlements/status/:settlementId")
  @ApiOperation({ summary: "Check settlement status" })
  async checkSettlementStatus(
    @Param("settlementId") settlementId: string,
    @User() { id }: UsersEntity,
  ) {
    return this.channelPartnersService.checkSettlementStatus(settlementId, id);
  }
}
