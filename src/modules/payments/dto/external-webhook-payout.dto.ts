import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

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

export class ExternalPayOutWebhookPayNProDto {
  @ApiProperty()
  @IsString()
  DATE: string;

  @ApiProperty()
  @IsString()
  STATUS: string;

  @ApiProperty()
  @IsString()
  CHECKSUM: string;

  @ApiProperty()
  @IsString()
  TXN_ID: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  AMOUNT: number;

  @ApiProperty()
  @IsString()
  PAYOUT_REF: string;

  @ApiProperty()
  @IsString()
  EMAIL_ID: string;

  @ApiProperty()
  @IsString()
  TXN_TYPE: string;

  @ApiProperty()
  @IsString()
  MOB_NO: string;

  @ApiProperty()
  @IsString()
  DESC: string;

  @ApiProperty()
  @IsString()
  RRN: string;
}

export class ExternalPayOutWebhookFlakPayDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsString()
  transferId: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  utr?: string;
}

export class ExternalEritechWebhookDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data: {
    status: string;
    response: {
      merchantId: string;
      orderId: number;
      txn_status: {
        utrNo: string;
        transactionStatus: string;
      };
      custUniqRef: string;
      amount: number;
    };
  };
}

export class ExternalPayOutWebhookEritechDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsString()
  transferId: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  utr?: string;
}

export class PayoutWebhookResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty({ type: String, format: "date-time" })
  timestamp: string;
}

export class ExternalPayoutRequestDto {
  partnertxnid: string;
  resp_msg: string;
  utr: string;
  GPID: string;
  status: string;
}
