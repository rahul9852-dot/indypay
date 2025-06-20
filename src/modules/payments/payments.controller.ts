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
import { ExternalPayinWebhookUtkarshDto } from "@/modules/payments/dto/external-webhook-payin.dto";
import { CustomLogger } from "@/logger";

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
}
