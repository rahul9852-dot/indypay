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
import {
  ExternalPayinWebhookTPIDto,
  ExternalPayinWebhookUtkarshDto,
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
    return this.paymentsService.createJioPayin(createTransactionDto, user);
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
  @ApiOperation({ summary: "Create pay-out transaction for dias pay" })
  @UseGuards(ApiKeyGuard)
  @Post("payout/create/dias-pay")
  async createPayoutDiasPay(
    @Body() createPayoutDto: CreatePayoutDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.createPayoutDiasPay(createPayoutDto, user);
  }

  @Public()
  @ApiOperation({
    summary: "Check status of pay-out transaction",
  })
  @HttpCode(HttpStatus.OK)
  @Post("payout/status/dias-pay")
  async checkStatusTransactionPayoutDiasPay(
    @Body() payoutStatusDto: PayoutStatusDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.checkPayOutStatusTransactionDiasPay(
      payoutStatusDto,
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
    return this.paymentsService.createPayoutTPIBulk(createPayoutDto, user);
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
    @Body() externalWebhookPayin: ExternalPayinWebhookTPIDto,
  ) {
    return this.paymentsService.externalWebhookPayinJio(externalWebhookPayin);
  }

  @Public()
  @ApiOperation({ summary: "External webhook for pay-in" })
  @UseGuards(WebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("/v2/payin/webhook")
  async externalWebhookPayinV2(
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
