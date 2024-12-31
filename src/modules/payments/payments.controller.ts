import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
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
import { Response } from "express";
import { PaymentsService } from "./payments.service";
import {
  CreatePayinPaymentResponseDto,
  PayinStatusDto,
  CreatePayinTransactionPayNProDto,
} from "./dto/create-payin-payment.dto";
import { GetTransactionsDetailsResponseDto } from "./dto/collection.dto";
import { PayoutStatusDto } from "./dto/create-payout-payment.dto";
import { ExternalPayinWebhookPayNProDto } from "./dto/external-webhook-payin.dto";
import { ExternalPayOutWebhookPayNProDto } from "./dto/external-webhook-payout.dto";
import { User } from "@/decorators/user.decorator";
import { IgnoreKyc } from "@/decorators/ignore-kyc.decorator";
import { IgnoreBusinessDetails } from "@/decorators/ignore-business-details.decorator";
import { Public } from "@/decorators/public.decorator";
import { ApiKeyGuard } from "@/guard/api-key.guard";
import { UsersEntity } from "@/entities/user.entity";
import { MessageResponseDto, PaginationWithDateDto } from "@/dtos/common.dto";
import { WebhookGuard } from "@/guard/webhook.guard";
import { AuthGuard } from "@/guard/auth.guard";
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
    @Body() createTransactionDto: CreatePayinTransactionPayNProDto,
    @User() user: UsersEntity,
    @Res() res: Response,
  ) {
    return this.paymentsService.createTransactionPayinPayNPro(
      createTransactionDto,
      user,
      res,
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
    return this.paymentsService.checkPayOutStatusTransaction(payoutStatusDto);
  }

  @Public()
  @ApiOperation({ summary: "External webhook for pay-in" })
  @UseGuards(WebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("payin/webhook")
  async externalWebhookPayin(
    @Body() externalPayinWebhookDto: ExternalPayinWebhookPayNProDto,
  ) {
    return this.paymentsService.externalWebhookPayinPayNPro(
      externalPayinWebhookDto,
    );
  }

  @Public()
  @ApiOperation({ summary: "External webhook for pay-out" })
  @UseGuards(WebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MessageResponseDto })
  @Post("payout/webhook")
  async externalWebhookPayout(
    @Body() externalWebhookPayout: ExternalPayOutWebhookPayNProDto,
  ) {
    return this.paymentsService.externalWebhookPayout(externalWebhookPayout);
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
}
