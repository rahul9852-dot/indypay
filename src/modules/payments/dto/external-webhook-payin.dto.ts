import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class DataDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  TxnPaymentStatus: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  TxnID: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  TxnMode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ChMod: string;

  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  Amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  CurrencyCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  TxnStatus: string;

  @ApiProperty()
  @IsString()
  Message: string;

  @ApiProperty()
  @IsString()
  Customer: string;

  @ApiProperty()
  @IsString()
  CustomerEmail: string;

  @ApiProperty()
  @IsString()
  CustomerPhone: string;

  @ApiProperty()
  @IsString()
  TransactionType: string;

  @ApiProperty()
  @IsString()
  TxnTime: string;

  @ApiProperty()
  @IsString()
  Utr: string;

  @ApiProperty()
  @IsString()
  CardType: string;

  @ApiProperty()
  @IsString()
  ref_no: string;
}

export class ExternalPayinWebhookAnviNeoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ServiceName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  Action: string;

  @ApiProperty()
  @IsObject()
  @IsNotEmpty()
  Data: DataDto;
}

export class ExternalPayinWebhookIsmartDto {
  @ApiProperty()
  @IsBoolean()
  status: boolean;

  @ApiProperty()
  @IsString()
  status_code: string;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  bank_id?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  order_id: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  transaction_id?: string;
}

export class ExternalPayinWebhookFlakPayDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  transactionRefId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  utr?: string;
}

export class ExternalPayinWebhookPayNProDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  data: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  key_id: string;
}

export class ExternalPayinWebhookUtkarshDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  txnId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  custRef: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  amount?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  txnStatus: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  refId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  uniqueId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  upiTxnId?: string;
}

export class ExternalPayinWebhookPayboltDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  utr?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  txnRefId?: string;
}

export class ExternalPayinWebhookTPIDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty()
  // @IsNumber()
  // @IsPositive()
  @IsNumber()
  @IsNotEmpty()
  amount: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  qr_code_id: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  payment_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bank_ref_no: string;
}
