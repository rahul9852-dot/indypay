import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Get,
  Query,
  Res,
  Param,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "express";
import { PaymentsService } from "./payments.service";
import {
  CreatePayinPaymentResponseDto,
  PayinStatusDto,
  CreatePayinTransactionFlaPayDto,
  CreatePayinTransactionGeoPayDTO,
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
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { AuthGuard } from "@/guard/auth.guard";
import { CryptoService } from "@/utils/encryption-algo.utils";
import {
  ExternalPayinWebhookOnikDto,
  ExternalPayinWebhookTPIDto,
} from "@/modules/payments/dto/external-webhook-payin.dto";
import { CustomLogger } from "@/logger";
import { DatabaseMonitorService } from "@/utils/db-monitor.utils";

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
    private readonly databaseMonitorService: DatabaseMonitorService,
  ) {}

  @Public()
  @ApiOperation({ summary: "Create pay-in transaction" })
  @UseGuards(ApiKeyGuard)
  @ApiCreatedResponse({ type: CreatePayinPaymentResponseDto })
  @Post("payin/create")
  async createPayInTransaction(
    @Body() createTransactionDto: CreatePayinTransactionFlaPayDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.createGeoPay(createTransactionDto, user);
  }

  @Public()
  @ApiOperation({ summary: "Create pay-in transaction" })
  @UseGuards(ApiKeyGuard)
  @ApiCreatedResponse({ type: CreatePayinPaymentResponseDto })
  @Post("/v2/payin/create")
  async createPayInTransactionV2(
    @Body() createTransactionDto: CreatePayinTransactionFlaPayDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.createUtkarshPaymentLink(
      createTransactionDto,
      user,
    );
  }

  @Public()
  @ApiOperation({ summary: "Create pay-in transaction" })
  @UseGuards(ApiKeyGuard)
  @ApiCreatedResponse({ type: CreatePayinPaymentResponseDto })
  @Post("/v3/payin/create")
  async createPayInTransactionOnik(
    @Body() createTransactionDto: CreatePayinTransactionFlaPayDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.createOnikPayin(createTransactionDto, user);
  }

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
  @ApiOperation({ summary: "Create pay-out transaction for dias pay" })
  @UseGuards(ApiKeyGuard)
  @Post("payout/create/kds")
  async createPayoutDiasPay(
    @Body() createPayoutDto: CreatePayoutDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.createPayoutKDS(createPayoutDto, user);
    // return this.paymentsService.createPayoutBuckBox(createPayoutDto, user);
  }

  // @Public()
  // @ApiOperation({
  //   summary: "Check status of pay-out transaction",
  // })
  // @HttpCode(HttpStatus.OK)
  // @Post("payout/status/dias-pay")
  // async checkStatusTransactionPayoutDiasPay(
  //   @Body() payoutStatusDto: PayoutStatusDto,
  //   @User() user: UsersEntity,
  // ) {
  //   return this.paymentsService.checkPayOutStatusTransactionDiasPay(
  //     payoutStatusDto,
  //     user,
  //   );
  // }

  @Public()
  @ApiOperation({ summary: "Create pay-out transaction Bulk" })
  @UseGuards(ApiKeyGuard)
  @Post("payout/create")
  async createPayoutBulk(
    @Body() createPayoutDto: CreatePayoutDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.createPayoutTPIBulk(createPayoutDto, user);
  }

  @Public()
  @ApiOperation({ summary: "Create pay-out transaction Bulk" })
  @UseGuards(ApiKeyGuard)
  @Post("v2/payout/create")
  async createPayoutBuckBox(
    @Body() createPayoutDto: CreatePayoutDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.createPayoutRockyPayz(createPayoutDto, user);
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
    return this.payoutService.checkPayOutStatusTransactionRocky(
      payoutStatusDto,
      user,
    );
  }

  @Public()
  @ApiOperation({ summary: "External webhook for pay-in" })
  @UseGuards(WebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("payin/webhook")
  async externalWebhookPayin(
    @Body() externalWebhookPayin: ExternalPayinWebhookTPIDto,
  ) {
    return this.paymentsService.externalWebhookPayinJio(externalWebhookPayin);
  }

  @Public()
  @ApiOperation({ summary: "GeoPay webhook for payment callback" })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("payin/geopay/webhook")
  async geoPayWebhook(@Body() webhookData: any, @Res() res: Response) {
    try {
      this.logger.info("GeoPay webhook received:", webhookData);

      // Process the webhook (you can expand this based on actual webhook format)
      await this.paymentsService.handleGeoPayWebhook(webhookData);

      return res.status(200).send("OK");
    } catch (error) {
      this.logger.error("GeoPay webhook processing failed:", error);

      return res.status(200).send("OK"); // Still send OK to prevent retries
    }
  }

  @Public()
  @ApiOperation({ summary: "Geo Pay Payout" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("payout/Geopay")
  async geoPayPayout(
    @Body() createPayoutDto: CreatePayoutDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.createPayoutGeoPay(createPayoutDto, user);
  }

  @Public()
  @ApiOperation({ summary: "GeoPay Payout API" })
  @UseGuards(WebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("payout/geopay/webhook")
  async geoPayPayoutWebhook(@Body() webhookData: any, @Res() res: Response) {
    return this.paymentsService.externalWebhookPayoutGeoPay(webhookData);
  }

  @Public()
  @ApiOperation({ summary: "External webhook for pay-in" })
  @UseGuards(WebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("v2/payin/webhook")
  async externalWebhookPayinV2(
    @Body() externalWebhookPayin: ExternalPayinWebhookOnikDto,
  ) {
    // return this.paymentsService.externalWebhookPayinUtkarsh(
    //   externalWebhookPayin,
    // );

    return this.paymentsService.externalWebhookPayinOnik(externalWebhookPayin);
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

  @Public()
  @ApiOperation({ summary: "External webhook for KDS pay-out" })
  @UseGuards(WebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("payout/webhook/kds")
  async externalWebhookPayoutKDS(@Body() externalWebhookPayout: any) {
    return this.paymentsService.externalWebhookPayoutKDS(externalWebhookPayout);
  }

  @Public()
  @ApiOperation({ summary: "External webhook for BuckBox pay-out" })
  @UseGuards(WebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("v2/payout/webhook")
  async externalWebhookPayoutBuckBox(@Body() externalWebhookPayout: any[]) {
    return this.paymentsService.externalWebhookPayoutRockyPayz(
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
  @ApiOperation({ summary: "GeoPay Checkout - Returns checkout URL" })
  @UseGuards(ApiKeyGuard)
  @Post("payin/geopay/checkout")
  async geoPayCheckout(
    @Body() createPayinTransactionDto: CreatePayinTransactionGeoPayDTO,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.createGeoPayCheckout(
      createPayinTransactionDto,
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
    return this.paymentsService.checkPayOutWalletBalance(user);
  }

  @Public()
  @Get("payin/geopay/checkout/:merchantTxnId")
  async geoPayCheckoutPage(
    @Param("merchantTxnId") merchantTxnId: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const checkoutData =
      await this.paymentsService.getGeoPayCheckoutPage(merchantTxnId);

    const inputs = Object.entries(checkoutData)
      .filter(([key]) => key !== "action")
      .map(
        ([key, value]) =>
          `<input type="hidden" name="${key}" value="${String(value)}" />`,
      )
      .join("\n");

    const html = `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <title>Redirecting...</title>
        </head>
        <body>
          <form id="pgForm" method="POST" action="${checkoutData.action}">
            ${inputs}
            <noscript>
              <button type="submit">Continue to payment</button>
            </noscript>
          </form>

          <script>
            document.getElementById("pgForm").submit();
          </script>
        </body>
        </html>`;

    res.status(200);
    res.setHeader("Content-Type", "text/html; charset=UTF-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.end(html);
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
          highConnections: poolStatus.poolStats.active_connections > 8, // 🚨 Adjusted for new max of 10
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
}
