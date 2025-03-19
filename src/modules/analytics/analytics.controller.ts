import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { RolesGuard } from "@/guard/roles.guard";
import { DateDto } from "@/dtos/common.dto";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";
import { User } from "@/decorators/user.decorator";
import { UsersEntity } from "@/entities/user.entity";

@ApiTags("Analytics")
@Controller("analytics")
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("/merchant/business-trend")
  @ApiOperation({ summary: "Get merchant's business trend analytics" })
  @Role(USERS_ROLE.MERCHANT)
  @ApiResponse({
    status: 200,
    description:
      "Returns merchant's business trend analytics including summary, insights, and payment method performance",
    schema: {
      type: "object",
      properties: {
        data: {
          type: "object",
          properties: {
            summary: {
              type: "object",
              properties: {
                successfulTransactionsRate: { type: "number" },
                numberOfSuccessfulTransactions: { type: "number" },
                volumeOfTransactions: { type: "number" },
              },
            },
            insights: {
              type: "object",
              properties: {
                successRate: { type: "number" },
                numberOfTransactions: { type: "number" },
                highestPaymentMethodSuccessRate: { type: "string" },
                lowestPaymentMethod: { type: "string" },
                totalSuccessGrossVolume: { type: "number" },
              },
            },
            tableData: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  paymentMethod: { type: "string" },
                  successRatioToday: { type: "number" },
                  successRatioYesterday: { type: "number" },
                  averageSuccessRatio: { type: "number" },
                  successToday: { type: "number" },
                  successYesterday: { type: "number" },
                  averageVolume: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
  })
  async getMerchantBusinessTrend(
    @User() user: UsersEntity,
    @Query() dateDto: DateDto,
  ) {
    return {
      data: await this.analyticsService.getBusinessTrend(user.id, dateDto),
    };
  }

  @Get("/admin/business-trend")
  @ApiOperation({ summary: "Get admin's business trend analytics" })
  @Role(USERS_ROLE.ADMIN)
  @ApiResponse({
    status: 200,
    description:
      "Returns admin's business trend analytics including summary, insights, and payment method performance",
    schema: {
      type: "object",
      properties: {
        data: {
          type: "object",
          properties: {
            summary: {
              type: "object",
              properties: {
                successfulTransactionsRate: { type: "number" },
                numberOfSuccessfulTransactions: { type: "number" },
                volumeOfTransactions: { type: "number" },
              },
            },
            insights: {
              type: "object",
              properties: {
                successRate: { type: "number" },
                numberOfTransactions: { type: "number" },
                highestPaymentMethodSuccessRate: { type: "string" },
                lowestPaymentMethod: { type: "string" },
                totalSuccessGrossVolume: { type: "number" },
              },
            },
            tableData: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  paymentMethod: { type: "string" },
                  successRatioToday: { type: "number" },
                  successRatioYesterday: { type: "number" },
                  averageSuccessRatio: { type: "number" },
                  successToday: { type: "number" },
                  successYesterday: { type: "number" },
                  averageVolume: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
  })
  async getAdminBusinessTrend(@Query() dateDto: DateDto) {
    return {
      data: await this.analyticsService.getBusinessTrend(null, dateDto),
    };
  }

  @Get("/payment-methods")
  @ApiOperation({ summary: "Get detailed payment method analytics" })
  @Role(USERS_ROLE.MERCHANT)
  async getPaymentMethodAnalytics(
    @User() user: UsersEntity,
    @Query() dateDto: DateDto,
  ) {
    return this.analyticsService.getPaymentMethodAnalytics(user.id, dateDto);
  }

  @Get("/hourly")
  @ApiOperation({ summary: "Get hourly transaction analytics" })
  @Role(USERS_ROLE.MERCHANT)
  async getHourlyAnalytics(
    @User() user: UsersEntity,
    @Query() dateDto: DateDto,
  ) {
    return this.analyticsService.getHourlyAnalytics(user.id, dateDto);
  }

  @Get("/admin/coversion-rate")
  @ApiOperation({ summary: "Get conversion rate analytics for admin" })
  @Role(USERS_ROLE.ADMIN)
  async getAdminConversionRate(@Query() dateDto: DateDto) {
    return this.analyticsService.getAdminConversionRate(dateDto);
  }

  @Get("/merchant/conversion-rate")
  @ApiOperation({ summary: "Get conversion rate analytics for merchant" })
  @Role(USERS_ROLE.MERCHANT)
  async getMerchantConversionRate(
    @User() user: UsersEntity,
    @Query() dateDto: DateDto,
  ) {
    return this.analyticsService.getMerchantConversionRate(user.id, dateDto);
  }

  @Get("/analytics/admin/failure")
  @ApiOperation({ summary: "Get failure analytics for admin" })
  @Role(USERS_ROLE.ADMIN)
  async getAdminFailureAnalytics(@Query() dateDto: DateDto) {
    return this.analyticsService.getAdminFailureAnalytics(dateDto);
  }

  @Get("/analytics/merchant/failure")
  @ApiOperation({ summary: "Get failure analytics for merchant" })
  @Role(USERS_ROLE.MERCHANT)
  async getMerchantFailureAnalytics(
    @User() user: UsersEntity,
    @Query() dateDto: DateDto,
  ) {
    return this.analyticsService.getMerchantFailureAnalytics(user.id, dateDto);
  }

  @Get("/admin/success")
  @ApiOperation({ summary: "Get success analytics for admin" })
  @Role(USERS_ROLE.ADMIN)
  async getAdminSuccessAnalytics(@Query() dateDto: DateDto) {
    return this.analyticsService.getAdminSuccessAnalytics(dateDto);
  }

  @Get("/merchant/success")
  @ApiOperation({ summary: "Get success analytics for merchant" })
  @Role(USERS_ROLE.MERCHANT)
  async getMerchantSuccessAnalytics(
    @User() user: UsersEntity,
    @Query() dateDto: DateDto,
  ) {
    return this.analyticsService.getMerchantSuccessAnalytics(user.id, dateDto);
  }
}
