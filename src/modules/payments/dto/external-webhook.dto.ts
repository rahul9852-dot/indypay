import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { PAYMENT_STATUS } from "@/enums/payment.enum";

export class ExternalPayinWebhookDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    enum: PAYMENT_STATUS,
    default: PAYMENT_STATUS.SUCCESS,
  })
  @IsEnum(PAYMENT_STATUS)
  @IsNotEmpty()
  status: PAYMENT_STATUS;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  transactionRefId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orderId: string;
}
