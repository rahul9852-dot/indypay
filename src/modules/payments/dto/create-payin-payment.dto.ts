import { ApiProperty, ApiResponseProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsPositive,
  IsString,
  Length,
} from "class-validator";

export class CreatePayinTransactionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pgReturnUrl: string;

  @ApiProperty()
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @IsPositive()
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  @Length(10, 10)
  phone: string;
}

export class PayinStatusDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orderId: string;
}

export class CreatePayinPaymentResponseDto {
  @ApiResponseProperty()
  orderId: string;

  @ApiResponseProperty()
  txnRefId: string;

  @ApiResponseProperty()
  paymentUrl: string;

  @ApiResponseProperty()
  qr: string;
}
