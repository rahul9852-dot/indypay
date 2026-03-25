import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Patch,
  UseGuards,
  Get,
  Query,
  Param,
  BadRequestException,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import {
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import {
  CreatePayinPaymentResponseDto,
  PayinStatusDto,
  CreatePayinTransactionAnviNeoDto,
  CreatePaymentLinkDto,
  CreatePaymentLinkResponseDto,
  GetPaymentLinkDetailsResponseDto,
  WhatsappShareResponseDto,
  CreateCheckoutDto,
  CreateCheckoutResponseDto,
} from "./dto/create-payin-payment.dto";
import {
  CreateCheckoutPageDto,
  UpdateCheckoutPageDto,
  CheckoutPagePayDto,
  CheckoutPageResponseDto,
  PublicCheckoutPageDto,
  CheckoutPagePayResponseDto,
  LogoUploadDto,
} from "./dto/checkout-page.dto";
import {
  SendReminderDto,
  ToggleAutoReminderDto,
} from "./dto/create-payin-payment.dto";
import { GetTransactionsDetailsResponseDto } from "./dto/collection.dto";
import { CreatePayoutDto } from "./dto/create-payout-payment.dto";
import { User } from "@/decorators/user.decorator";
import { IgnoreKyc } from "@/decorators/ignore-kyc.decorator";
import { IgnoreBusinessDetails } from "@/decorators/ignore-business-details.decorator";
import { Public } from "@/decorators/public.decorator";
import { ApiKeyGuard } from "@/guard/api-key.guard";
import { UsersEntity } from "@/entities/user.entity";
import { PaginationWithDateAndStatusDto } from "@/dtos/common.dto";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";
import { PaginationWithDateDto } from "@/dtos/common.dto";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { AuthGuard } from "@/guard/auth.guard";
import { CustomLogger } from "@/logger";
import { DatabaseMonitorService } from "@/utils/db-monitor.utils";
import { IntegrationMappingService } from "@/modules/integrations/integration-mapping.service";
import { IntegrationPayinRouterService } from "@/modules/integrations/integration-payin-router.service";

@IgnoreKyc()
@IgnoreBusinessDetails()
@ApiTags("Payments")
@Controller("payments")
@UseGuards(AuthGuard)
export class PaymentsController {
  private readonly logger = new CustomLogger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly databaseMonitorService: DatabaseMonitorService,
    private readonly integrationMappingService: IntegrationMappingService,
    private readonly integrationPayinRouterService: IntegrationPayinRouterService,
  ) {}

  @Public()
  @ApiOperation({ summary: "Create pay-in transaction" })
  @UseGuards(ApiKeyGuard)
  @ApiCreatedResponse({ type: CreatePayinPaymentResponseDto })
  @Post("payin/create")
  async createPayInTransaction(
    @Body() createTransactionDto: CreatePayinTransactionAnviNeoDto,
    @User() user: UsersEntity,
  ) {
    // Step 1: Get user's integration mapping
    const integrationCode =
      await this.integrationMappingService.getUserIntegration(user.id);

    // Step 2: Route to the appropriate integration
    const result = await this.integrationPayinRouterService.routePayin(
      integrationCode,
      createTransactionDto,
      user,
    );

    // Step 3: Record transaction amount for limit tracking (async, don't wait)
    this.integrationMappingService
      .recordTransactionAmount(integrationCode, createTransactionDto.amount)
      .catch((err) => {
        this.logger.error(
          `Failed to record transaction amount for limit tracking: ${err.message}`,
        );
      });

    return result;
  }

  @Public()
  @ApiOperation({
    summary: "Check status of pay-in transaction",
  })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Post("payin/status")
  async checkStatusTransactionPayin(
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

  @ApiOperation({
    summary: "Create pay-out transaction for dashboard",
  })
  @Post("payout/dashboard")
  async createPayoutDashboard(
    @Body() createPayoutDto: CreatePayoutDto,
    @User() user: UsersEntity,
  ) {
    if (user.isPayoutDisabledFromDashboard) {
      throw new BadRequestException("Payout is disabled from dashboard");
    }

    return this.paymentsService.createPayoutFlakPayBulk(createPayoutDto, user);
  }

  @ApiOperation({ summary: "List payment links for the dashboard" })
  @ApiOkResponse({ type: GetTransactionsDetailsResponseDto })
  @Get("payment-link")
  @Role(USERS_ROLE.MERCHANT, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  async getPaymentLinks(
    @User() user: UsersEntity,
    @Query() paginationDto: PaginationWithDateAndStatusDto,
  ) {
    return this.paymentsService.getPaymentLinks(user, paginationDto);
  }

  @Public()
  @ApiOperation({
    summary: "Payout Wallet of Merchant",
  })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Get("payout/wallet")
  async checkPayOutWallet(@User() user: UsersEntity) {
    return this.paymentsService.checkPayOutWalletBalance(user);
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

  @Get("health/database")
  @Role(USERS_ROLE.ADMIN)
  async getDatabaseHealth() {
    try {
      // Get basic pool status first
      const poolStatus =
        await this.databaseMonitorService.getConnectionPoolStatus();

      // Get additional stats with error handling
      let longRunning = [];
      let walletLocks = [];
      let slowWalletQueries = [];
      let indexStats = [];

      try {
        longRunning =
          await this.databaseMonitorService.getLongRunningTransactions(1);
      } catch (error) {
        this.logger.warn(
          `Failed to get long running transactions: ${error.message}`,
        );
      }

      try {
        walletLocks = await this.databaseMonitorService.getWalletLockStats();
      } catch (error) {
        this.logger.warn(`Failed to get wallet lock stats: ${error.message}`);
      }

      try {
        slowWalletQueries =
          await this.databaseMonitorService.getSlowWalletQueries();
      } catch (error) {
        this.logger.warn(`Failed to get slow wallet queries: ${error.message}`);
      }

      try {
        indexStats = await this.databaseMonitorService.getWalletIndexStats();
      } catch (error) {
        this.logger.warn(`Failed to get wallet index stats: ${error.message}`);
      }

      // Get TPS and index information
      let walletTPS = null;
      let walletIndexes = null;

      try {
        walletTPS = await this.databaseMonitorService.getWalletUpdateTPS();
      } catch (error) {
        this.logger.warn(`Failed to get wallet TPS: ${error.message}`);
      }

      try {
        walletIndexes = await this.databaseMonitorService.checkWalletIndexes();
      } catch (error) {
        this.logger.warn(`Failed to check wallet indexes: ${error.message}`);
      }

      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
        poolStatus,
        longRunningTransactions: longRunning.length,
        walletLocks: walletLocks.length,
        slowWalletQueries: slowWalletQueries.length,
        indexStats,
        walletTPS,
        walletIndexes,
        alerts: {
          highConnections: poolStatus.poolStats.active_connections > 8,
          longRunningQueries: poolStatus.timeoutStats?.long_running_queries > 0,
          walletLockContention:
            walletLocks.filter((l) => !l.granted).length > 0,
          slowWalletUpdates: slowWalletQueries.length > 0,
        },
      };
    } catch (error) {
      this.logger.error("Database health check failed:", error);

      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  @Get("monitor/tps")
  @Role(USERS_ROLE.ADMIN)
  async getWalletTPS() {
    try {
      const [walletTPS, walletIndexes] = await Promise.all([
        this.databaseMonitorService.getWalletUpdateTPS(),
        this.databaseMonitorService.checkWalletIndexes(),
      ]);

      return {
        status: "success",
        timestamp: new Date().toISOString(),
        walletTPS,
        walletIndexes,
        performance: {
          hasOptimizedIndexes: walletIndexes?.hasUserIdVersionIndex || false,
          currentTPS: parseFloat(walletTPS?.stats?.tps || 0).toFixed(2),
          avgDuration: parseFloat(
            walletTPS?.stats?.avg_duration_seconds || 0,
          ).toFixed(3),
          slowUpdates: walletTPS?.slowUpdates?.length || 0,
        },
      };
    } catch (error) {
      this.logger.error("TPS monitoring failed:", error);

      return {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  @ApiOperation({ summary: "Create payment link with encrypted details" })
  @ApiCreatedResponse({ type: CreatePaymentLinkResponseDto })
  @Post("payment-link/create")
  async createPaymentLink(
    @Body() createPaymentLinkDto: CreatePaymentLinkDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.createPaymentLink(createPaymentLinkDto, user);
  }

  @Public()
  @ApiOperation({
    summary:
      "Get payment link details by linkId (decrypts and returns details). " +
      "Increments view count. Returns isExpired/isPaid flags instead of throwing.",
  })
  @ApiOkResponse({ type: GetPaymentLinkDetailsResponseDto })
  @Get("payment-link/:linkId")
  async getPaymentLinkDetails(
    @Param("linkId") linkId: string,
    @Req() req: Request,
  ) {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
      req.ip ??
      undefined;

    return this.paymentsService.getPaymentLinkDetails(linkId, ip);
  }

  // ─── Payment Link Analytics & Reminders ──────────────────────────────────

  @ApiOperation({
    summary: "Get analytics for a payment link (opens, cities, conversion)",
  })
  @Get("payment-link/:linkId/analytics")
  @Role(USERS_ROLE.MERCHANT, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  async getPaymentLinkAnalytics(
    @Param("linkId") linkId: string,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.getPaymentLinkAnalytics(linkId, user.id);
  }

  @ApiOperation({
    summary: "Get reminders config + history for a payment link",
  })
  @Get("payment-link/:linkId/reminders")
  @Role(USERS_ROLE.MERCHANT, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  async getPaymentLinkReminders(
    @Param("linkId") linkId: string,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.getPaymentLinkReminders(linkId, user.id);
  }

  @ApiOperation({ summary: "Toggle auto-reminders on/off for a payment link" })
  @Patch("payment-link/:linkId/reminders/auto")
  @Role(USERS_ROLE.MERCHANT, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  async togglePaymentLinkAutoReminder(
    @Param("linkId") linkId: string,
    @Body() dto: ToggleAutoReminderDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.togglePaymentLinkAutoReminder(
      linkId,
      user.id,
      dto.enabled,
    );
  }

  @ApiOperation({ summary: "Send an immediate reminder via WhatsApp or SMS" })
  @Post("payment-link/:linkId/reminders/send")
  @Role(USERS_ROLE.MERCHANT, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  async sendPaymentLinkReminder(
    @Param("linkId") linkId: string,
    @Body() dto: SendReminderDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.sendPaymentLinkReminder(
      linkId,
      user.id,
      dto.channel,
    );
  }

  @ApiOperation({
    summary:
      "Get a pre-built WhatsApp share URL for a payment link. " +
      "One tap opens WhatsApp with amount and link pre-filled — no copy-paste needed.",
  })
  @ApiOkResponse({ type: WhatsappShareResponseDto })
  @Get("payment-link/:linkId/whatsapp-share")
  @Role(USERS_ROLE.MERCHANT, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  async getWhatsappShareUrl(
    @Param("linkId") linkId: string,
    @User() user: UsersEntity,
  ) {
    const link = await this.paymentsService.getOwnPaymentLink(linkId, user.id);
    const linkUrl = `${process.env.BE_BASE_URL ?? ""}/api/v1/payments/payment-link/${linkId}`;
    const whatsappShareUrl = this.paymentsService.buildWhatsappShareUrl({
      amount: +link.amount,
      linkUrl,
      note: link.note,
    });

    return {
      whatsappShareUrl,
      message:
        "Open this URL on mobile to share the payment link via WhatsApp.",
    };
  }

  // ─── Checkout Pages — Merchant (authenticated) ───────────────────────────
  // NOTE: specific paths (/checkout-pages/logo-upload-url, /:id/publish, /:id/pay)
  // must be declared BEFORE the generic /:id catch-all to avoid route shadowing.

  @ApiOperation({
    summary: "Get a presigned S3 URL to upload a checkout page logo",
    description:
      "Returns a presigned PUT URL (expires in 1 hour) and the permanent fileUrl. " +
      "PUT the logo binary directly to presignedUrl, then pass fileUrl as logoUrl " +
      "when creating / updating the checkout page.",
  })
  @Post("checkout-pages/logo-upload-url")
  async getLogoUploadUrl(
    @Body() dto: LogoUploadDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.getLogoUploadUrl(
      user.id,
      dto.fileName,
      dto.fileType,
    );
  }

  @ApiOperation({
    summary: "List all checkout pages for the current merchant",
    description:
      "Returns each page enriched with its shareable `pageUrl` " +
      "so the dashboard can show a share button without a second call.",
  })
  @ApiOkResponse({ description: "Array of checkout pages with pageUrl" })
  @Get("checkout-pages")
  async getAllCheckoutPages(@User() user: UsersEntity) {
    return this.paymentsService.getAllCheckoutPages(user.id);
  }

  @ApiOperation({ summary: "Create a checkout page (saved as DRAFT)" })
  @ApiCreatedResponse({ type: CheckoutPageResponseDto })
  @Post("checkout-pages")
  async createCheckoutPage(
    @Body() dto: CreateCheckoutPageDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.createCheckoutPage(dto, user);
  }

  @ApiOperation({
    summary: "Publish a draft checkout page — makes it live for customers",
    description:
      "Sets status to PUBLISHED and returns the shareable `pageUrl`. " +
      "Safe to call on an already-published page — idempotent.",
  })
  @ApiCreatedResponse({ type: CheckoutPageResponseDto })
  @Post("checkout-pages/:id/publish")
  async publishCheckoutPage(
    @Param("id") id: string,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.publishCheckoutPage(id, user);
  }

  @ApiOperation({ summary: "Get one checkout page by id (merchant only)" })
  @ApiOkResponse()
  @Get("checkout-pages/:id")
  async getCheckoutPageById(
    @Param("id") id: string,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.getCheckoutPageById(id, user);
  }

  @ApiOperation({ summary: "Update a checkout page" })
  @Put("checkout-pages/:id")
  async updateCheckoutPage(
    @Param("id") id: string,
    @Body() dto: UpdateCheckoutPageDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.updateCheckoutPage(id, dto, user);
  }

  // ─── Checkout Pages — Public (customer-facing, no auth) ──────────────────

  @Public()
  @ApiOperation({
    summary: "Get a published checkout page config (public — no auth required)",
    description:
      "Called by the frontend when a customer opens a hosted checkout page URL. " +
      "Returns only PUBLISHED pages. Returns 404 for draft or non-existent pages. " +
      "Intentionally excludes internal fields (userId, redirect URLs).",
  })
  @ApiOkResponse({ type: PublicCheckoutPageDto })
  @Get("checkout-pages/:id/public")
  async getPublicCheckoutPage(@Param("id") id: string) {
    return this.paymentsService.getPublicCheckoutPage(id);
  }

  @Public()
  @ApiOperation({
    summary: "Customer submits checkout page form and initiates payment",
    description:
      "Called when a customer fills the hosted checkout page and clicks Pay. " +
      "Validates amount against page config, creates a checkout session, " +
      "and returns the payment gateway URL to redirect the customer to.",
  })
  @ApiCreatedResponse({ type: CheckoutPagePayResponseDto })
  @HttpCode(HttpStatus.CREATED)
  @Post("checkout-pages/:id/pay")
  async initiateCheckoutPagePayment(
    @Param("id") id: string,
    @Body() dto: CheckoutPagePayDto,
  ) {
    return this.paymentsService.initiateCheckoutPagePayment(id, dto);
  }

  @Public()
  @ApiOperation({ summary: "Create checkout session" })
  @UseGuards(ApiKeyGuard)
  @ApiCreatedResponse({ type: CreateCheckoutResponseDto })
  @Post("checkout/create")
  async createCheckout(
    @Body() createCheckoutDto: CreateCheckoutDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.createCheckout(createCheckoutDto, user);
  }

  @Public()
  @ApiOperation({ summary: "Get checkout details by checkoutId" })
  @ApiOkResponse()
  @Get("checkout/:checkoutId")
  async getCheckoutDetails(@Param("checkoutId") checkoutId: string) {
    return this.paymentsService.getCheckoutDetails(checkoutId);
  }
}
