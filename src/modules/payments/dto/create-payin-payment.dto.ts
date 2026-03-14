import { ApiProperty, ApiResponseProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from "class-validator";

export class CreatePayinTransactionAnviNeoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty()
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @IsPositive()
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  @Length(10, 10)
  mobile: string;
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

export class CreatePaymentLinkDto {
  @ApiProperty()
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @IsPositive()
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  @Length(10, 10)
  mobile: string;

  @ApiProperty({
    description: "Expiry time in minutes from now",
    example: 30,
  })
  @IsNumber()
  @IsPositive()
  expiresInMinutes: number;

  @ApiProperty({
    description: "Whether to notify on this email",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  notifyOnEmail?: boolean;

  @ApiProperty({
    description: "Whether to notify on this number",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  notifyOnNumber?: boolean;
}

export class CreatePaymentLinkResponseDto {
  @ApiResponseProperty()
  linkId: string;

  @ApiResponseProperty()
  paymentLinkUrl: string;

  @ApiResponseProperty()
  expiresAt: string;

  @ApiResponseProperty()
  message: string;
}

export class GetPaymentLinkDetailsResponseDto {
  @ApiResponseProperty()
  linkId: string;

  @ApiResponseProperty()
  amount: number;

  @ApiResponseProperty()
  email: string;

  @ApiResponseProperty()
  name: string;

  @ApiResponseProperty()
  mobile: string;

  @ApiResponseProperty()
  expiresAt: string;

  @ApiResponseProperty()
  isExpired: boolean;

  @ApiResponseProperty()
  notifyOnEmail: boolean;

  @ApiResponseProperty()
  notifyOnNumber: boolean;
}

export class CreateCheckoutDto {
  @ApiProperty()
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @IsPositive()
  amount: number;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  @Length(10, 10)
  mobile: string;

  @ApiProperty({
    description: "Whether to notify on this email",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  notifyOnEmail?: boolean;

  @ApiProperty({
    description: "Whether to notify on this number",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  notifyOnNumber?: boolean;
}

export class CreateCheckoutResponseDto {
  @ApiResponseProperty()
  checkoutId: string;

  @ApiResponseProperty()
  checkoutUrl: string;

  @ApiResponseProperty()
  message: string;
}
