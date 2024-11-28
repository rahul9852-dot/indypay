import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ExternalPayoutWebhookIsmartDto {
  @ApiProperty()
  @IsBoolean()
  status: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  status_code: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  transaction_id: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty()
  @IsString()
  bank_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  order_id: string;

  @ApiProperty()
  @IsString()
  purpose: string;

  @ApiProperty()
  @IsString()
  narration: string;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty()
  @IsString()
  wallet_id: string;

  @ApiProperty()
  @IsString()
  wallet_name: string;

  @ApiProperty()
  @IsString()
  created_on: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orderId: string;
}
