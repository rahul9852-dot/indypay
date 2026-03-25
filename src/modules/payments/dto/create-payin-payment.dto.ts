import {
  ApiProperty,
  ApiPropertyOptional,
  ApiResponseProperty,
} from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";

// ─── Pay-in (API) ─────────────────────────────────────────────────────────────

export class CreatePayinTransactionAnviNeoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
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

// ─── Create Payment Link ──────────────────────────────────────────────────────

export class CreatePaymentLinkDto {
  @ApiProperty({ example: 5000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({ example: "Rahul Kumar" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "rahul@example.com" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "9876543210" })
  @IsNumberString()
  @IsNotEmpty()
  @Length(10, 10)
  mobile: string;

  @ApiPropertyOptional({
    description:
      "ISO 8601 date-time string for when the link expires. " +
      "Omit or set to null for a link that never expires.",
    example: "2026-04-01T18:30:00.000Z",
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: "Optional note visible on the payment page and PDF receipt.",
    example: "Invoice #1042 for October rice supply",
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({
    description:
      "When true, the customer may pay any amount ≥ minimumAmount " +
      "(advance + balance flow). Common for B2B textile / construction merchants.",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  allowPartialPayment?: boolean;

  @ApiPropertyOptional({
    description:
      "Minimum partial payment accepted (in ₹). " +
      "Only applies when allowPartialPayment is true. Must be less than amount.",
    example: 1000,
  })
  @IsOptional()
  @ValidateIf((o) => o.allowPartialPayment === true && o.minimumAmount != null)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(1)
  minimumAmount?: number;

  @ApiPropertyOptional({
    description: "Send payment confirmation to this email address.",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  notifyOnEmail?: boolean;

  @ApiPropertyOptional({
    description: "Send payment confirmation SMS to this mobile number.",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  notifyOnNumber?: boolean;
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

export class CreatePaymentLinkResponseDto {
  @ApiResponseProperty()
  linkId: string;

  @ApiResponseProperty()
  paymentLinkUrl: string;

  /** null when expiryPreset = "never". */
  @ApiResponseProperty()
  expiresAt: string | null;

  /** Pre-built WhatsApp share URL with the payment link and amount pre-filled. */
  @ApiResponseProperty()
  whatsappShareUrl: string;

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
  note: string | null;

  @ApiResponseProperty()
  allowPartialPayment: boolean;

  @ApiResponseProperty()
  minimumPartialAmount: number | null;

  @ApiResponseProperty()
  expiresAt: string | null;

  @ApiResponseProperty()
  isExpired: boolean;

  @ApiResponseProperty()
  notifyOnEmail: boolean;

  @ApiResponseProperty()
  notifyOnNumber: boolean;

  @ApiResponseProperty()
  viewCount: number;
}

export class WhatsappShareResponseDto {
  @ApiResponseProperty()
  whatsappShareUrl: string;

  @ApiResponseProperty()
  message: string;
}

// ─── Payment Link Analytics ────────────────────────────────────────────────────

export class SendReminderDto {
  @ApiProperty({ enum: ["whatsapp", "sms"] })
  @IsString()
  channel: "whatsapp" | "sms";
}

export class ToggleAutoReminderDto {
  @ApiProperty()
  @IsBoolean()
  enabled: boolean;
}

// ─── Checkout ─────────────────────────────────────────────────────────────────

export class CreateCheckoutDto {
  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
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

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  notifyOnEmail?: boolean;

  @ApiPropertyOptional({ default: false })
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
