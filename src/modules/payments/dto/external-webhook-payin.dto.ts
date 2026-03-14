import { IsNotEmpty, IsObject, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

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
  @IsString()
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
