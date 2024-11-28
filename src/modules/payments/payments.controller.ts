import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
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
import { ExternalPayinWebhookIsmartDto } from "./dto/external-webhook-payin.dto";
import { PayoutStatusDto } from "./dto/create-payout-payment.dto";
import { ExternalPayoutWebhookIsmartDto } from "./dto/external-webhook-payout.dto";
import { User } from "@/decorators/user.decorator";
import { IgnoreKyc } from "@/decorators/ignore-kyc.decorator";
import { IgnoreBusinessDetails } from "@/decorators/ignore-business-details.decorator";
import { Public } from "@/decorators/public.decorator";
import { ApiKeyGuard } from "@/guard/api-key.guard";
import { UsersEntity } from "@/entities/user.entity";
import { MessageResponseDto } from "@/dtos/common.dto";
import { WebhookGuard } from "@/guard/webhook.guard";

@IgnoreKyc()
@IgnoreBusinessDetails()
@Public()
@ApiTags("Payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

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

  @ApiOperation({ summary: "Check status of pay-in transaction" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Post("payin/status")
  async checkStatusTransactionPayin(@Body() payinStatusDto: PayinStatusDto) {
    return this.paymentsService.checkPayInStatusTransaction(payinStatusDto);
  }

  @ApiOperation({ summary: "Check status of pay-out transaction" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Post("payout/status")
  async checkStatusTransactionPayout(@Body() payoutStatusDto: PayoutStatusDto) {
    return this.paymentsService.checkPayOutStatusTransaction(payoutStatusDto);
  }

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

  @ApiOperation({ summary: "External webhook for pay-out" })
  @UseGuards(WebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("payout/webhook")
  async externalWebhookPayout(
    @Body() externalWebhookPayout: ExternalPayoutWebhookIsmartDto,
  ) {
    return this.paymentsService.externalWebhookPayout(externalWebhookPayout);
  }
}
