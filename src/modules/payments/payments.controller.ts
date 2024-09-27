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
  CreatePaymentResponseDto,
  CreateTransactionDto,
} from "./dto/create-payment.dto";
import { ExternalPayinWebhookDto } from "./dto/external-webhook.dto";
import { User } from "@/decorators/user.decorator";
import { IgnoreKyc } from "@/decorators/ignore-kyc.decorator";
import { IgnoreBusinessDetails } from "@/decorators/ignore-business-details.decorator";
import { Public } from "@/decorators/public.decorator";
import { ApiKeyGuard } from "@/guard/api-key.guard";
import { UsersEntity } from "@/entities/user.entity";
import { PAYMENT_TYPE } from "@/enums/payment.enum";
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
  @ApiCreatedResponse({ type: CreatePaymentResponseDto })
  @Post("payin/create")
  async createPayInTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.createTransaction(
      createTransactionDto,
      user,
      PAYMENT_TYPE.PAYIN,
    );
  }

  @ApiOperation({ summary: "Create pay-out transaction" })
  @UseGuards(ApiKeyGuard)
  @Post("payout/create")
  async createPayOutTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
    @User() user: UsersEntity,
  ) {
    return this.paymentsService.createTransaction(
      createTransactionDto,
      user,
      PAYMENT_TYPE.PAYOUT,
    );
  }

  @ApiOperation({ summary: "Check status of pay-in transaction" })
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @Post("payin/status")
  async checkStatusTransaction(@Body("orderId") orderId: string) {
    return this.paymentsService.checkPayInStatusTransaction(orderId);
  }

  @ApiOperation({ summary: "External webhook for pay-in" })
  @UseGuards(WebhookGuard)
  @ApiOperation({ summary: "External webhook" })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("payin/webhook")
  async externalWebhookUpdateStatus(
    @Body() externalPayinWebhookDto: ExternalPayinWebhookDto,
  ) {
    return this.paymentsService.externalPayinWebhookUpdateStatus(
      externalPayinWebhookDto,
    );
  }
}
