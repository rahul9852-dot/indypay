import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Get,
  Query,
  BadRequestException,
  Render,
  Res,
  Param,
  NotFoundException,
  Put,
  Delete,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import * as dayjs from "dayjs";
import * as utc from "dayjs/plugin/utc";
import * as timezone from "dayjs/plugin/timezone";
import { Response } from "express";
import { PaymentsService } from "./payments.service";
import {
  CreatePayinPaymentResponseDto,
  PayinStatusDto,
  CreatePayinTransactionFlaPayDto,
} from "./dto/create-payin-payment.dto";
import { GetTransactionsDetailsResponseDto } from "./dto/collection.dto";
import {
  CreatePayoutDto,
  PayoutStatusDto,
} from "./dto/create-payout-payment.dto";
import { User } from "@/decorators/user.decorator";
import { IgnoreKyc } from "@/decorators/ignore-kyc.decorator";
import { IgnoreBusinessDetails } from "@/decorators/ignore-business-details.decorator";
import { Public } from "@/decorators/public.decorator";
import { ApiKeyGuard } from "@/guard/api-key.guard";
import { UsersEntity } from "@/entities/user.entity";
import {
  MessageResponseDto,
  PaginationWithDateAndStatusDto,
} from "@/dtos/common.dto";
import { WebhookGuard } from "@/guard/webhook.guard";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";
import { PayoutService } from "@/modules/payout/payout.service";
import { PaginationWithDateDto } from "@/dtos/common.dto";
import { CheckoutDto } from "@/modules/payments/dto/checkout.dto";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { AuthGuard } from "@/guard/auth.guard";
import { CryptoService } from "@/utils/encryption-algo.utils";
import { ExternalPayinWebhookUtkarshDto } from "@/modules/payments/dto/external-webhook-payin.dto";
import { CustomLogger } from "@/logger";
import { appConfig } from "@/config/app.config";
import { enhancedVpaRoutingService } from "@/utils/enhanced-vpa-routing.util";
import { todayStartDate } from "@/utils/date.utils";

// Extend dayjs with the required plugins
dayjs.extend(utc);
dayjs.extend(timezone);

@IgnoreKyc()
@IgnoreBusinessDetails()
@ApiTags("Payments")
@Controller("payments")
@UseGuards(AuthGuard)
export class PaymentsController {
  private readonly logger = new CustomLogger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly payoutService: PayoutService,
    private readonly encryptionAlgoService: CryptoService,
  ) {}

  @Public()
  @ApiOperation({ summary: "Get VPA routing statistics" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Get("vpa/stats")
  async getVPAStats() {
    return this.paymentsService.getVPAStats();
  }

  @Public()
  @ApiOperation({ summary: "Get active VPAs" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Get("vpa/active")
  async getActiveVPAs() {
    return this.paymentsService.getActiveVPAs();
  }

  @Public()
  @ApiOperation({ summary: "Get VPA monitoring status" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Get("vpa/monitoring/status")
  async getVPAMonitoringStatus() {
    return this.paymentsService.getVPAMonitoringStatus();
  }

  @Public()
  @ApiOperation({ summary: "Get VPA alerts" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Get("vpa/alerts")
  async getVPAlerts() {
    return this.paymentsService.getVPAlerts();
  }

  @Public()
  @ApiOperation({ summary: "Get VPA configuration" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Get("vpa/config")
  async getVPAConfig() {
    return this.paymentsService.getVPAConfig();
  }

  @Public()
  @ApiOperation({ summary: "Add new VPA" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post("vpa")
  async addVPA(@Body() vpaConfig: any) {
    return this.paymentsService.addVPA(vpaConfig);
  }

  @Public()
  @ApiOperation({ summary: "Update VPA" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Put("vpa/:vpa")
  async updateVPA(@Param("vpa") vpa: string, @Body() updates: any) {
    return this.paymentsService.updateVPA(vpa, updates);
  }

  @Public()
  @ApiOperation({ summary: "Remove VPA" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Delete("vpa/:vpa")
  async removeVPA(@Param("vpa") vpa: string) {
    return this.paymentsService.removeVPA(vpa);
  }

  @Public()
  @ApiOperation({ summary: "Update routing strategy" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Put("vpa/routing/strategy")
  async updateRoutingStrategy(
    @Body() body: { strategy: string; config?: any },
  ) {
    return this.paymentsService.updateRoutingStrategy(
      body.strategy,
      body.config,
    );
  }

  @Public()
  @ApiOperation({ summary: "Debug VPA service data availability" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Get("vpa/debug")
  async debugVPAService() {
    this.logger.info("Debug VPA service endpoint called");

    return this.paymentsService.debugVPAService();
  }

  @Public()
  @ApiOperation({ summary: "Debug VPA health scores (no auth required)" })
  @HttpCode(HttpStatus.OK)
  @Get("vpa/debug-health")
  async debugVPAHealthScores() {
    this.logger.info("Debug VPA health scores endpoint called");

    return this.paymentsService.debugVPAHealthScores();
  }

  @Public()
  @ApiOperation({ summary: "Get VPA volume limits status" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Get("vpa/volume-limits")
  async getVPAVolumeLimits() {
    this.logger.info("VPA volume limits endpoint called");

    return this.paymentsService.getVPAVolumeLimits();
  }

  @Public()
  @ApiOperation({ summary: "Create pay-in transaction" })
  @UseGuards(ApiKeyGuard)
  @ApiCreatedResponse({ type: CreatePayinPaymentResponseDto })
  @Post("payin/create")
  async createPayInTransaction(
    @Body() createTransactionDto: CreatePayinTransactionFlaPayDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.createUtkarshPaymentLink(
      createTransactionDto,
      user,
    );
  }

  // @Public()
  // @ApiOperation({
  //   summary: "Check status of pay-in transaction",
  // })
  // @UseGuards(ApiKeyGuard)
  // @HttpCode(HttpStatus.OK)
  // @Post("payin/status")
  // async checkStatusTransactionPayin(
  //   @Body() payinStatusDto: PayinStatusDto,
  //   @User() user: UsersEntity,
  // ) {
  //   return this.paymentsService.checkPayInStatusTransaction(
  //     payinStatusDto,
  //     user,
  //   );
  // }

  @Public()
  @ApiOperation({
    summary: "Check status of pay-in transaction",
  })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Post("payin/status")
  async checkStatusTransactionPayinUtkarsh(
    @Body() payinStatusDto: PayinStatusDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.checkPayInStatusTransaction(
      payinStatusDto,
      user,
    );
  }

  @Public()
  @ApiOperation({ summary: "Create pay-out transaction Bulk" })
  @UseGuards(ApiKeyGuard)
  @Post("payout/create")
  async createPayoutBulk(
    @Body() createPayoutDto: CreatePayoutDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.createPayoutFlakPayBulk(createPayoutDto, user);
  }

  // @Public()
  // @ApiOperation({ summary: "Create pay-out transaction" })
  // @UseGuards(ApiKeyGuard)
  // @Post("payout/single-create")
  // async createPayout(
  //   @Body() singlePayoutDto: SinglePayoutDto,
  //   @User() user: UsersEntity,
  // ) {
  //   return this.paymentsService.createPayoutEritechSingle(
  //     singlePayoutDto,
  //     user,
  //   );
  // }

  @ApiOperation({
    summary: "Create pay-out transaction for dashboard",
  })
  @Post("payout/dashboard")
  async createPayoutDashboardIsmart(
    @Body() createPayoutDto: CreatePayoutDto,
    @User() user: UsersEntity,
  ) {
    if (user.isPayoutDisabledFromDashboard) {
      throw new BadRequestException("Payout is disabled from dashboard");
    }

    return this.paymentsService.createPayoutFlakPayBulk(createPayoutDto, user);
  }

  @Public()
  @ApiOperation({
    summary: "Check status of pay-out transaction",
  })
  @HttpCode(HttpStatus.OK)
  @Post("payout/status")
  async checkStatusTransactionPayout(
    @Body() payoutStatusDto: PayoutStatusDto,
    @User() user: UsersEntity,
  ) {
    return this.payoutService.checkPayOutStatusTransactionEritech(
      payoutStatusDto,
      user,
    );
  }

  @Public()
  @ApiOperation({
    summary: "Payout Wallet of Merchant",
  })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Get("payout/wallet")
  async checkPayOutWallet(@User() user: UsersEntity) {
    return this.paymentsService.checkPayOutWalletFlakPay(user);
  }

  @Public()
  @ApiOperation({ summary: "External webhook for pay-in" })
  @UseGuards(WebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("payin/webhook")
  async externalWebhookPayin(
    @Body() externalWebhookPayin: ExternalPayinWebhookUtkarshDto,
  ) {
    return this.paymentsService.externalWebhookPayinUtkarsh(
      externalWebhookPayin,
    );
  }

  @Public()
  @ApiOperation({ summary: "External webhook for pay-out" })
  @UseGuards(WebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("payout/webhook")
  async externalWebhookPayout(@Body() externalWebhookPayout: any) {
    return this.paymentsService.externalWebhookPayoutEritech(
      externalWebhookPayout,
    );
  }

  @ApiOperation({ summary: "Get all collection list" })
  @ApiOkResponse({ type: GetTransactionsDetailsResponseDto })
  @Get("payment-link")
  @Role(USERS_ROLE.MERCHANT, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  async getTransactionsForDashboard(
    @User() user: UsersEntity,
    @Query() paginationDto: PaginationWithDateAndStatusDto,
  ) {
    return this.paymentsService.getTransactionsDetails(user, paginationDto);
  }

  @Public()
  @ApiOperation({ summary: "Checkout API" })
  @Post("checkout")
  @Render("pg-form-request")
  async checkout(@Body() checkoutDto: CheckoutDto) {
    const data = await this.paymentsService.checkout(checkoutDto);

    return data;
  }

  @ApiExcludeEndpoint()
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  @Post("update-status")
  async updateMisspelledTransactions(
    @Body()
    {
      orderId,
      status,
      utr,
    }: {
      orderId: string;
      status: PAYMENT_STATUS;
      utr?: string;
    },
  ) {
    return this.paymentsService.webhookRequestUs({
      orderId,
      status,
      utr,
    });
  }

  @ApiExcludeEndpoint()
  @Get("misspelled-transactions")
  @Role(USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  async getMisspelledTransactions(@Query() query: PaginationWithDateDto) {
    return this.paymentsService.getMisspelledPayinTransactions(query);
  }

  @Public()
  @ApiOperation({ summary: "External webhook for checkout" })
  @Post("webhook/checkout")
  async sabpaisaWebhook(@Body() body: any, @Res() res: Response) {
    try {
      // Process the webhook data first
      const rawBody = typeof body === "string" ? body : JSON.stringify(body);
      await this.paymentsService.handleCheckoutWebhookRawBody(rawBody);

      // Handle redirection if we have encResponse
      if (body.encResponse) {
        try {
          const decoded = decodeURIComponent(body.encResponse);
          const decryptedString = this.encryptionAlgoService.decrypt(decoded);
          const params = new URLSearchParams(decryptedString);
          const clientTxnId =
            params.get("clientTxnId") ||
            params.get("transactionId") ||
            params.get("orderId");

          if (clientTxnId) {
            const statusPageUrl = `${process.env.BE_BASE_URL}/api/v1/payments/checkout/status/${clientTxnId}`;

            return res.redirect(statusPageUrl);
          }
        } catch (decryptError) {
          this.logger.error("Error decrypting data:", decryptError);
        }
      }

      // If no redirection happened, send OK response
      return res.status(200).send("OK");
    } catch (error) {
      this.logger.error("Webhook processing failed:", error);

      return res.status(200).send("OK"); // Still send OK to payment gateway even if processing fails
    }
  }

  @Public()
  @ApiOperation({ summary: "Checkout Payment Status Page" })
  @Get("checkout/status/:clientTxnId")
  @Render("checkout-response")
  async checkoutStatusPage(@Param("clientTxnId") id: string) {
    const checkout = await this.paymentsService.getCheckoutByClientTxnId(id);

    if (!checkout) {
      throw new NotFoundException("Checkout not found");
    }

    const { payerEmail, payerName, amount, status, clientTxnId } = checkout;

    const statusConfig = {
      [PAYMENT_STATUS.SUCCESS]: {
        title: "Payment Successful",
        message:
          "Your payment has been processed successfully thanks for choosing Paybolt",
        statusClass: "success",
      },
      [PAYMENT_STATUS.FAILED]: {
        title: "Payment Failed",
        message: "We couldn't process your payment. Please try again.",
        statusClass: "failed",
      },
      [PAYMENT_STATUS.PENDING]: {
        title: "Payment Pending",
        message: "Your payment is being processed. Please wait.",
        statusClass: "pending",
      },
      [PAYMENT_STATUS.INITIATED]: {
        title: "Payment Initiated",
        message: "Your payment has been initiated.",
        statusClass: "pending",
      },
      [PAYMENT_STATUS.ABORTED]: {
        title: "Payment Aborted",
        message: "Your payment was aborted.",
        statusClass: "failed",
      },
    };

    const config = statusConfig[checkout.status] || {
      title: "Payment Status",
      message: "Your payment status is being processed.",
      statusClass: "pending",
    };

    const result = {
      ...config,
      status,
      clientTxnId,
      amount,
      payerName,
      payerEmail,
      dateTime: new Date().toLocaleString(),
      returnUrl: `https://paybolt.in`,
    };

    return result;
  }

  // this api is used to redirect user to payment link UI
  // @Public()
  // @IgnoreBusinessDetails()
  // @IgnoreKyc()
  // @IgnoreMobileVerification()
  // @Get("redirect/payment-link/:payinId")
  // async redirectPaymentLink(
  //   @Param("payinId") payinId: string,
  //   @Res() res: Response,
  // ) {
  //   return this.paymentsService.redirectPaymentLink(payinId, res);
  // }

  // this api is used to check payment status from payment link UI
  // @Public()
  // @IgnoreBusinessDetails()
  // @IgnoreKyc()
  // @IgnoreMobileVerification()
  // @Get("redirect/payment-link/status/:orderId")
  // async checkPaymentStatus(
  //   @Param("orderId") orderId: string,
  //   @Req() req: Request,
  // ) {
  //   return this.paymentsService.checkPaymentStatus(orderId, req);
  // }

  @Get("vpa-debug")
  @Public()
  async getVPADebugInfo() {
    const {
      utkarsh: { vpas },
    } = appConfig();

    return {
      statusCode: 200,
      message: "VPA Debug Information",
      success: true,
      data: {
        configuredVPAs:
          vpas?.map((v) => ({
            vpa: v.vpa,
            priority: v.priority,
            isActive: v.isActive,
            description: v.description,
          })) || [],
        metricsVPAs: Array.from(enhancedVpaRoutingService["vpaMetrics"].keys()),
        totalConfigured: vpas?.length || 0,
        totalWithMetrics: enhancedVpaRoutingService["vpaMetrics"].size,
        serviceHealth: enhancedVpaRoutingService.isServiceHealthy(),
      },
    };
  }

  @Public()
  @ApiOperation({ summary: "Debug VPA metrics and cache" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Get("vpa/debug-metrics")
  async debugVPAMetrics() {
    this.logger.info("Debug VPA metrics endpoint called");

    try {
      // Force refresh metrics from cache
      await enhancedVpaRoutingService.forceRefreshMetricsFromCache();

      // Get current stats
      const stats = await enhancedVpaRoutingService.getEnhancedVPAStats();

      // Get debug data availability
      await enhancedVpaRoutingService.debugDataAvailability();

      return {
        message: "VPA metrics debug completed",
        timestamp: new Date().toISOString(),
        stats,
        cacheStatus: "Refreshed from cache",
      };
    } catch (error) {
      this.logger.error(`VPA metrics debug failed: ${error.message}`);

      return {
        message: "VPA metrics debug failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Public()
  @ApiOperation({ summary: "Manually record a transaction for testing" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Post("vpa/test-transaction")
  async testVPATransaction(
    @Body()
    body: {
      orderId: string;
      vpa: string;
      amount: number;
      status: "SUCCESS" | "FAILED";
      responseTime?: number;
    },
  ) {
    this.logger.info("Test VPA transaction endpoint called", body);

    try {
      // Record transaction start
      const routingResult = await enhancedVpaRoutingService.selectVPA(
        "test-user",
        body.amount,
        body.orderId,
      );

      // Process webhook
      await enhancedVpaRoutingService.processPaymentWebhook(
        body.orderId,
        body.status as any,
        body.responseTime,
      );

      // Get updated stats
      const stats = await enhancedVpaRoutingService.getEnhancedVPAStats();

      return {
        message: "Test transaction recorded successfully",
        orderId: body.orderId,
        vpa: body.vpa,
        status: body.status,
        routingResult,
        stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Test VPA transaction failed: ${error.message}`);

      return {
        message: "Test transaction failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get IST date from a Date object for consistent comparison
   */
  private getISTDateFromDate(date: Date): string {
    return dayjs(date).tz("Asia/Kolkata").format("YYYY-MM-DD");
  }

  @Public()
  @ApiOperation({ summary: "Debug daily metrics issue" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Get("vpa/debug-daily")
  async debugDailyMetrics() {
    this.logger.info("Debug daily metrics endpoint called");

    try {
      // Get current stats
      const stats = await enhancedVpaRoutingService.getEnhancedVPAStats();

      // Get current date info using existing date utilities
      const now = new Date();
      const today = todayStartDate();

      // Check each VPA's daily metrics
      const debugInfo =
        stats.healthMetrics?.map((metric: any) => {
          const lastTransactionDate = new Date(metric.lastTransactionTime);
          // Calculate the day from the actual last transaction time
          const lastTransactionDay = dayjs(lastTransactionDate)
            .tz("Asia/Kolkata")
            .startOf("day")
            .toDate();

          // Get IST date strings for comparison
          const lastTransactionISTDate =
            this.getISTDateFromDate(lastTransactionDate);
          const todayISTDate = this.getISTDateFromDate(today);

          return {
            vpa: metric.vpa,
            dailySuccessCount: metric.dailySuccessCount,
            dailyFailureCount: metric.dailyFailureCount,
            dailyTotalAmount: metric.dailyTotalAmount,
            lastTransactionTime: metric.lastTransactionTime,
            lastTransactionDate: lastTransactionDate.toISOString(),
            lastTransactionDay: dayjs(lastTransactionDay)
              .tz("Asia/Kolkata")
              .format(),
            today: dayjs(today).tz("Asia/Kolkata").format(),
            lastTransactionISTDate,
            todayISTDate,
            isSameDay: lastTransactionISTDate === todayISTDate,
            totalSuccessCount: metric.successCount,
            totalFailureCount: metric.failureCount,
            weeklySuccessCount: metric.weeklySuccessCount,
            monthlySuccessCount: metric.monthlySuccessCount,
          };
        }) || [];

      return {
        message: "Daily metrics debug information",
        timestamp: new Date().toISOString(),
        currentDate: {
          now: now.toISOString(),
          today: dayjs(today).tz("Asia/Kolkata").format(), // Keep in IST timezone
          todayIST: dayjs(today).tz("Asia/Kolkata").format("YYYY-MM-DD"),
          timezone: "Asia/Kolkata",
        },
        debugInfo,
      };
    } catch (error) {
      this.logger.error(`Daily metrics debug failed: ${error.message}`);

      return {
        message: "Daily metrics debug failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Public()
  @ApiOperation({ summary: "Force reset daily metrics for testing" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Post("vpa/force-reset-daily")
  async forceResetDailyMetrics() {
    this.logger.info("Force reset daily metrics endpoint called");

    try {
      await enhancedVpaRoutingService.resetDailyMetrics();

      return {
        message: "Daily metrics reset successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Force reset daily metrics failed: ${error.message}`);

      return {
        message: "Force reset daily metrics failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Public()
  @ApiOperation({ summary: "Test date calculations" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Get("vpa/test-dates")
  async testDateCalculations() {
    this.logger.info("Test date calculations endpoint called");

    try {
      const now = new Date();
      const today = todayStartDate();
      const currentISTDate = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");
      const todayISTDate = this.getISTDateFromDate(today);

      return {
        message: "Date calculation test",
        now: now.toISOString(),
        today: dayjs(today).tz("Asia/Kolkata").format(),
        currentISTDate,
        todayISTDate,
        timezone: "Asia/Kolkata",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Test date calculations failed: ${error.message}`);

      return {
        message: "Test date calculations failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Public()
  @ApiOperation({
    summary: "Check daily reset status and force reset if needed",
  })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Get("vpa/daily-reset-status")
  async getDailyResetStatus() {
    this.logger.info("Daily reset status endpoint called");

    try {
      const currentISTDate = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");
      const today = todayStartDate();

      // Get current stats to check daily metrics
      const stats = await enhancedVpaRoutingService.getEnhancedVPAStats();
      const hasNonZeroDailyMetrics = stats.healthMetrics?.some(
        (metric: any) =>
          metric.dailySuccessCount > 0 ||
          metric.dailyFailureCount > 0 ||
          metric.dailyTotalAmount > 0,
      );

      return {
        message: "Daily reset status",
        currentISTDate,
        todayStartDate: today.toISOString(),
        timezone: "Asia/Kolkata",
        hasNonZeroDailyMetrics,
        totalVPAs: stats.totalVPAs,
        activeVPAs: stats.activeVPAs,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Daily reset status failed: ${error.message}`);

      return {
        message: "Daily reset status failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Public()
  @ApiOperation({ summary: "Test daily metrics update" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Post("vpa/test-daily-update")
  async testDailyMetricsUpdate(
    @Body()
    body: {
      vpa: string;
      amount: number;
      responseTime?: number;
    },
  ) {
    this.logger.info("Test daily metrics update endpoint called", body);

    try {
      // Get stats before
      const statsBefore = await enhancedVpaRoutingService.getEnhancedVPAStats();
      const vpaBefore = statsBefore.healthMetrics?.find(
        (m: any) => m.vpa === body.vpa,
      );

      // Record a success
      await enhancedVpaRoutingService.recordSuccess(
        body.vpa,
        body.responseTime || 1000,
        body.amount,
      );

      // Get stats after
      const statsAfter = await enhancedVpaRoutingService.getEnhancedVPAStats();
      const vpaAfter = statsAfter.healthMetrics?.find(
        (m: any) => m.vpa === body.vpa,
      );

      return {
        message: "Daily metrics test completed",
        vpa: body.vpa,
        before: {
          dailySuccessCount: vpaBefore?.dailySuccessCount || 0,
          dailyTotalAmount: vpaBefore?.dailyTotalAmount || 0,
          totalSuccessCount: vpaBefore?.successCount || 0,
        },
        after: {
          dailySuccessCount: vpaAfter?.dailySuccessCount || 0,
          dailyTotalAmount: vpaAfter?.dailyTotalAmount || 0,
          totalSuccessCount: vpaAfter?.successCount || 0,
        },
        difference: {
          dailySuccessCount:
            (vpaAfter?.dailySuccessCount || 0) -
            (vpaBefore?.dailySuccessCount || 0),
          dailyTotalAmount:
            (vpaAfter?.dailyTotalAmount || 0) -
            (vpaBefore?.dailyTotalAmount || 0),
          totalSuccessCount:
            (vpaAfter?.successCount || 0) - (vpaBefore?.successCount || 0),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Daily metrics test failed: ${error.message}`);

      return {
        message: "Daily metrics test failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Public()
  @ApiOperation({ summary: "Force refresh metrics and check daily reset" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Post("vpa/force-refresh-metrics")
  async forceRefreshMetrics() {
    this.logger.info("Force refresh metrics endpoint called");

    try {
      // Force refresh metrics from cache
      await enhancedVpaRoutingService.forceRefreshMetricsFromCache();

      // Check and reset daily metrics if needed
      await enhancedVpaRoutingService.refreshMetrics();

      // Get updated stats
      const stats = await enhancedVpaRoutingService.getEnhancedVPAStats();

      return {
        message: "Metrics refreshed and daily reset checked",
        timestamp: new Date().toISOString(),
        totalVPAs: stats.totalVPAs,
        activeVPAs: stats.activeVPAs,
        healthMetrics: stats.healthMetrics?.map((metric: any) => ({
          vpa: metric.vpa,
          dailySuccessCount: metric.dailySuccessCount,
          dailyFailureCount: metric.dailyFailureCount,
          dailyTotalAmount: metric.dailyTotalAmount,
          totalSuccessCount: metric.successCount,
          totalFailureCount: metric.failureCount,
        })),
      };
    } catch (error) {
      this.logger.error(`Force refresh metrics failed: ${error.message}`);

      return {
        message: "Force refresh metrics failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Public()
  @ApiOperation({ summary: "Debug daily reset logic" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Get("vpa/debug-daily-reset")
  async debugDailyReset() {
    this.logger.info("Debug daily reset endpoint called");

    try {
      const currentISTDate = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");
      const today = todayStartDate();

      // Get current stats
      const stats = await enhancedVpaRoutingService.getEnhancedVPAStats();

      // Check if any VPAs have non-zero daily metrics
      const vpasWithNonZeroDaily =
        stats.healthMetrics?.filter(
          (metric: any) =>
            metric.dailySuccessCount > 0 ||
            metric.dailyFailureCount > 0 ||
            metric.dailyTotalAmount > 0,
        ) || [];

      return {
        message: "Daily reset debug information",
        currentISTDate,
        todayStartDate: today.toISOString(),
        timezone: "Asia/Kolkata",
        lastDailyResetDate: enhancedVpaRoutingService.getLastDailyResetDate(),
        totalVPAs: stats.totalVPAs,
        activeVPAs: stats.activeVPAs,
        vpasWithNonZeroDaily: vpasWithNonZeroDaily.map((metric: any) => ({
          vpa: metric.vpa,
          dailySuccessCount: metric.dailySuccessCount,
          dailyFailureCount: metric.dailyFailureCount,
          dailyTotalAmount: metric.dailyTotalAmount,
          lastTransactionTime: metric.lastTransactionTime,
        })),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Debug daily reset failed: ${error.message}`);

      return {
        message: "Debug daily reset failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
