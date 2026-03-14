import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiCreatedResponse, ApiTags } from "@nestjs/swagger";
import {
  CreatePayinPaymentResponseDto,
  CreatePayinTransactionAnviNeoDto,
  PayinStatusDto,
} from "@/modules/payments/dto/create-payin-payment.dto";
import { IgnoreKyc } from "@/decorators/ignore-kyc.decorator";
import { IgnoreBusinessDetails } from "@/decorators/ignore-business-details.decorator";
import { generateOtp } from "@/utils/helperFunctions.utils";
import { generateQrCode } from "@/utils/upiqr.util";
import { generateDummyPaymentUrl } from "@/utils/docs.utils";
import { ApiKeyGuard } from "@/guard/api-key.guard";
import { Public } from "@/decorators/public.decorator";
import { PAYMENT_STATUS } from "@/enums/payment.enum";

@IgnoreKyc()
@IgnoreBusinessDetails()
@Public()
@UseGuards(ApiKeyGuard)
@ApiTags("Docs")
@Controller("docs")
export class DocsController {
  constructor() {}

  @Post("payin")
  @ApiCreatedResponse({ type: CreatePayinPaymentResponseDto })
  async payin(@Body() createTransactionDto: CreatePayinTransactionAnviNeoDto) {
    const paymentUrl = await generateDummyPaymentUrl({
      amount: createTransactionDto.amount.toFixed(2),
    });
    const qr = await generateQrCode(paymentUrl.intent);

    return {
      orderId: createTransactionDto.orderId,
      txnRefId: generateOtp(20),
      paymentUrl: paymentUrl.intent,
      qr,
    };
  }

  @Post("payin/status")
  async payinStatus(@Body() payinStatusDto: PayinStatusDto) {
    return {
      orderId: payinStatusDto.orderId,
      status: PAYMENT_STATUS.SUCCESS,
      txnRefId: generateOtp(20),
    };
  }
}
