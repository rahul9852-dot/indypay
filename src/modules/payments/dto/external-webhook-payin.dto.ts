import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsObject,
  IsPositive,
  IsString,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

// const example = {
//   ServiceName: "QRCollection",
//   Action: "QRCollection",
//   Data: {
//     TxnPaymentStatus: "SUCCESS",
//     TxnID: "DYQRC151124065108CPI",
//     TxnMode: "LIVE",
//     ChMod: "upi",
//     Amount: "2.00",
//     CurrencyCode: "356",
//     TxnStatus: "200",
//     Message: "Success",
//     Customer: "",
//     CustomerEmail: "VIVEK@PAYBOLT.IN",
//     CustomerPhone: "9876543210",
//     TransactionType: "320",
//     TxnTime: "15-11-2024 06:51:08",
//     Utr: "432023637572",
//     CardType: "",
//     ref_no: "test_pin_12",
//   },
// };

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
  bank_id?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  order_id: string;

  @ApiProperty()
  @IsString()
  transaction_id?: string;
}
