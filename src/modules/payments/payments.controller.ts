import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Get,
  Query,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import {
  CreatePayinPaymentResponseDto,
  PayinStatusDto,
  CreatePayinTransactionIsmartDto,
} from "./dto/create-payin-payment.dto";
import { GetTransactionsDetailsResponseDto } from "./dto/collection.dto";
import {
  CreatePayoutDto,
  PayoutStatusDto,
} from "./dto/create-payout-payment.dto";
import { ExternalPayinWebhookIsmartDto } from "./dto/external-webhook-payin.dto";
import { ExternalPayOutWebhookFlakPayDto } from "./dto/external-webhook-payout.dto";
import { User } from "@/decorators/user.decorator";
import { IgnoreKyc } from "@/decorators/ignore-kyc.decorator";
import { IgnoreBusinessDetails } from "@/decorators/ignore-business-details.decorator";
import { Public } from "@/decorators/public.decorator";
import { ApiKeyGuard } from "@/guard/api-key.guard";
import { UsersEntity } from "@/entities/user.entity";
import { MessageResponseDto, PaginationWithDateDto } from "@/dtos/common.dto";
import { WebhookGuard } from "@/guard/webhook.guard";
import { Role } from "@/decorators/role.decorator";
import { USERS_ROLE } from "@/enums";

@IgnoreKyc()
@IgnoreBusinessDetails()
@ApiTags("Payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @ApiOperation({ summary: "Create pay-in transaction" })
  @UseGuards(ApiKeyGuard)
  @ApiCreatedResponse({ type: CreatePayinPaymentResponseDto })
  @Post("payin/create")
  async createPayInTransaction(
    @Body() createTransactionDto: CreatePayinTransactionIsmartDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.createTransactionPayinIsmart(
      createTransactionDto,
      user,
    );
  }

  @Public()
  @ApiOperation({ summary: "Create pay-out transaction" })
  @UseGuards(ApiKeyGuard)
  @Post("payout/create")
  async createPayout(
    @Body() createPayoutDto: CreatePayoutDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.createPayoutFlakPay(createPayoutDto, user);
  }

  @ApiOperation({ summary: "Create pay-out transaction for dashboard" })
  @Post("payout/dashboard")
  async createPayoutDashboardIsmart(
    @Body() createPayoutIsmartDto: CreatePayoutDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.createPayoutFlakPay(
      createPayoutIsmartDto,
      user,
    );
  }

  @Public()
  @ApiOperation({ summary: "Check status of pay-in transaction" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Post("payin/status")
  async checkStatusTransactionPayin(@Body() payinStatusDto: PayinStatusDto) {
    return this.paymentsService.checkPayInStatusTransaction(payinStatusDto);
  }

  @Public()
  @ApiOperation({ summary: "Check status of pay-out transaction" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Post("payout/status")
  async checkStatusTransactionPayout(@Body() payoutStatusDto: PayoutStatusDto) {
    return this.paymentsService.checkPayOutStatusTransactionFlakPay(
      payoutStatusDto,
    );
  }

  @Public()
  @ApiOperation({ summary: "External webhook for pay-in" })
  @UseGuards(WebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("payin/webhook")
  async externalWebhookPayin(
    @Body() externalPayinWebhookDto: ExternalPayinWebhookIsmartDto,
  ) {
    return this.paymentsService.externalWebhookPayin(externalPayinWebhookDto);
  }

  @Public()
  @ApiOperation({ summary: "External webhook for pay-out" })
  @UseGuards(WebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("payout/webhook")
  async externalWebhookPayout(
    @Body() externalWebhookPayout: ExternalPayOutWebhookFlakPayDto,
  ) {
    return this.paymentsService.externalWebhookPayoutFlaPay(
      externalWebhookPayout,
    );
  }

  @ApiOperation({ summary: "Get all collection list" })
  @ApiOkResponse({ type: GetTransactionsDetailsResponseDto })
  @Get("payment-link")
  @Role(USERS_ROLE.MERCHANT, USERS_ROLE.ADMIN, USERS_ROLE.OWNER)
  async getTransactionsForDashboard(
    @User() user: UsersEntity,
    @Query() paginationDto: PaginationWithDateDto,
  ) {
    return this.paymentsService.getTransactionsDetails(user, paginationDto);
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
