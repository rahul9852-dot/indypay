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
  Logger,
} from "@nestjs/common";
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
  CreatePayinTransactionFlaPayDto,
} from "./dto/create-payin-payment.dto";
import { GetTransactionsDetailsResponseDto } from "./dto/collection.dto";
import {
  CreatePayoutDto,
  PayoutStatusDto,
  SinglePayoutDto,
} from "./dto/create-payout-payment.dto";
import { PaymentResponseDto } from "./dto/payment-response.dto";
import { ExternalPayinWebhookFlakPayDto } from "./dto/external-webhook-payin.dto";
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

@IgnoreKyc()
@IgnoreBusinessDetails()
@ApiTags("Payments")
@Controller("payments")
@UseGuards(AuthGuard)
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly payoutService: PayoutService,
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
    return this.paymentsService.createTransactionPayinFlakPay(
      createTransactionDto,
      user,
    );
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

  @Public()
  @ApiOperation({ summary: "Create pay-out transaction" })
  @UseGuards(ApiKeyGuard)
  @Post("payout/single-create")
  async createPayout(
    @Body() singlePayoutDto: SinglePayoutDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.createPayoutEritechSingle(
      singlePayoutDto,
      user,
    );
  }

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
    @Body() externalPayinWebhookDto: ExternalPayinWebhookFlakPayDto,
  ) {
    return this.paymentsService.externalWebhookPayinFlakPay(
      externalPayinWebhookDto,
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
  async checkout() {
    return this.paymentsService.checkout();
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
  @Get("initPgReq")
  @ApiOperation({ summary: "Initialize payment gateway request" })
  @Render("pg-form-request")
  async initPgRequest() {
    try {
      const formData = await this.paymentsService.checkout();
      this.logger.debug("Form data:", formData.data.formData);

      return {
        formData: formData.data.formData,
      };
    } catch (error) {
      this.logger.error("Error handling payment request:", error);
      throw error;
    }
  }

  @Public()
  @Post("getPgResponse")
  @ApiOperation({ summary: "Handle payment gateway response" })
  @Render("pg-form-response")
  async handlePaymentResponse(@Body() responseDto: PaymentResponseDto) {
    try {
      const decryptedResponse =
        await this.paymentsService.handlePaymentResponse(responseDto.encData);
      this.logger.debug("Decrypted response:", decryptedResponse);

      return { decryptedResponse: JSON.stringify(decryptedResponse, null, 2) };
    } catch (error) {
      this.logger.error("Error handling payment response:", error);
      throw error;
    }
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
