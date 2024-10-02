import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { EXTERNAL_PAYOUT_PAYMENT_STATUS } from "@/enums/payment.enum";

export class ExternalPayoutWebhookDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    enum: EXTERNAL_PAYOUT_PAYMENT_STATUS,
    default: EXTERNAL_PAYOUT_PAYMENT_STATUS.SUCCESS,
  })
  @IsEnum(EXTERNAL_PAYOUT_PAYMENT_STATUS)
  @IsNotEmpty()
  status: EXTERNAL_PAYOUT_PAYMENT_STATUS;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  transferId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orderId: string;
}
