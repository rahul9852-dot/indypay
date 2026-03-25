import {
  ApiProperty,
  ApiPropertyOptional,
  ApiResponseProperty,
} from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsHexColor,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import {
  CheckoutAmountType,
  CheckoutCustomField,
  CheckoutPageStatus,
} from "@/entities/checkout-page.entity";

// ─── Custom field ─────────────────────────────────────────────────────────────

export class CheckoutCustomFieldDto {
  @ApiProperty({ example: "order_id" })
  @IsString()
  key: string;

  @ApiProperty({ example: "Order ID" })
  @IsString()
  label: string;

  @ApiProperty({
    example: "text",
    description: "text | number | email | select",
  })
  @IsString()
  type: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional({
    type: [String],
    description: "Options list — only used when type = 'select'",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];
}

// ─── Create ───────────────────────────────────────────────────────────────────

export class CreateCheckoutPageDto {
  @ApiPropertyOptional({
    example: "Product Launch Sale",
    description:
      "Internal label — only visible to merchant in their dashboard.",
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description:
      "Public URL of the merchant logo shown at the top of the page.",
    example: "https://cdn.example.com/logo.png",
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({
    example: "Pay for your order",
    description: "Headline shown to the customer on the checkout page.",
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description:
      "Rich HTML description — bold, italic, lists allowed. " +
      "Shown below the title to explain what the customer is paying for.",
    example: "<p>Pay securely for your <b>October rice supply</b>.</p>",
  })
  @IsOptional()
  @IsString()
  pageDescription?: string;

  @ApiPropertyOptional({
    example: "#6366F1",
    description:
      "Brand hex colour for the pay button, header accent, and links. " +
      "Defaults to RupeeFlow blue (#6366F1) when not set.",
  })
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @ApiPropertyOptional({
    example: "Pay Now",
    description:
      "Label on the primary pay button. " +
      'Common choices: "Pay Now", "Donate", "Subscribe", "Buy Now".',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  buttonText?: string;

  @ApiPropertyOptional({ example: "9876543210" })
  @IsOptional()
  @IsString()
  contactMobile?: string;

  @ApiPropertyOptional({ example: "support@mystore.com" })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional({
    description: "HTML terms and conditions shown at checkout.",
  })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiProperty({
    enum: CheckoutAmountType,
    default: CheckoutAmountType.USER_ENTERED,
    description:
      "FIXED — amount is preset by merchant. " +
      "USER_ENTERED — customer types their own amount.",
  })
  @IsEnum(CheckoutAmountType)
  amountType: CheckoutAmountType;

  @ApiPropertyOptional({
    example: 5000,
    description: "Fixed amount in rupees. Required when amountType = FIXED.",
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  fixedAmount?: number | null;

  @ApiPropertyOptional({
    example: 100,
    description:
      "Minimum amount the customer can enter (only for USER_ENTERED). " +
      "Prevents ₹1 test/spam payments.",
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minimumAmount?: number | null;

  @ApiPropertyOptional({
    default: false,
    description:
      "When true, the checkout form collects a delivery address. " +
      "Useful for physical goods merchants.",
  })
  @IsOptional()
  @IsBoolean()
  collectAddress?: boolean;

  @ApiPropertyOptional({
    type: [CheckoutCustomFieldDto],
    default: [],
    description:
      "Extra custom fields beyond the standard name/email/mobile. " +
      'E.g. [{key:"gst_number", label:"GST Number", type:"text", required:false}]',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutCustomFieldDto)
  customFields?: CheckoutCustomFieldDto[];

  @ApiPropertyOptional({
    example: "https://mystore.com/thank-you",
    description:
      "Redirect URL after a successful payment. " +
      "Leave empty to show the built-in RupeeFlow success screen.",
  })
  @IsOptional()
  @IsString()
  successRedirectUrl?: string | null;

  @ApiPropertyOptional({
    example: "https://mystore.com/payment-failed",
    description:
      "Redirect URL after a failed or cancelled payment. " +
      "Leave empty to show the built-in RupeeFlow failure screen.",
  })
  @IsOptional()
  @IsString()
  failureRedirectUrl?: string | null;

  @ApiPropertyOptional({
    example: "Thank you! Your order will ship in 2–3 business days.",
    description:
      "Custom thank-you message shown on the success screen " +
      "(only when successRedirectUrl is not set).",
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  successMessage?: string | null;

  @ApiPropertyOptional({
    enum: CheckoutPageStatus,
    default: CheckoutPageStatus.DRAFT,
    description:
      "DRAFT = save without publishing. PUBLISHED = live for customers.",
  })
  @IsOptional()
  @IsEnum(CheckoutPageStatus)
  status?: CheckoutPageStatus;
}

// ─── Update (all fields optional) ─────────────────────────────────────────────

export class UpdateCheckoutPageDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() logoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pageDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsHexColor() primaryColor?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  buttonText?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactMobile?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() termsAndConditions?: string;
  @ApiPropertyOptional({ enum: CheckoutAmountType })
  @IsOptional()
  @IsEnum(CheckoutAmountType)
  amountType?: CheckoutAmountType;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) fixedAmount?:
    | number
    | null;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) minimumAmount?:
    | number
    | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() collectAddress?: boolean;

  @ApiPropertyOptional({ type: [CheckoutCustomFieldDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutCustomFieldDto)
  customFields?: CheckoutCustomFieldDto[];

  @ApiPropertyOptional() @IsOptional() @IsString() successRedirectUrl?:
    | string
    | null;
  @ApiPropertyOptional() @IsOptional() @IsString() failureRedirectUrl?:
    | string
    | null;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  successMessage?: string | null;

  @ApiPropertyOptional({ enum: CheckoutPageStatus })
  @IsOptional()
  @IsEnum(CheckoutPageStatus)
  status?: CheckoutPageStatus;
}

// ─── Customer pays through a hosted checkout page ─────────────────────────────

export class CheckoutPagePayDto {
  @ApiProperty({ example: "Rahul Kumar" })
  @IsString()
  name: string;

  @ApiProperty({ example: "rahul@example.com" })
  @IsString()
  email: string;

  @ApiProperty({ example: "9876543210" })
  @IsString()
  @Length(10, 10)
  mobile: string;

  @ApiPropertyOptional({
    example: 5000,
    description:
      "Amount in rupees — required when page amountType = USER_ENTERED.",
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @ApiPropertyOptional({
    description: "Delivery address — required when page collectAddress = true.",
    example: "12, MG Road, Hyderabad, 500001",
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description:
      "Key-value map of responses for the page's custom fields. " +
      'E.g. {"order_id": "ORD-1042", "gst_number": "29AABCT1332L1ZD"}',
  })
  @IsOptional()
  customFieldValues?: Record<string, string>;
}

// ─── Logo Upload ──────────────────────────────────────────────────────────────

export class LogoUploadDto {
  @ApiProperty({ example: "logo.png" })
  @IsString()
  fileName: string;

  @ApiProperty({ example: "image/png" })
  @IsString()
  fileType: string;
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

/** Returned to the merchant after create / publish. */
export class CheckoutPageResponseDto {
  @ApiResponseProperty() id: string;
  @ApiResponseProperty() pageUrl: string;
  @ApiResponseProperty() status: CheckoutPageStatus;
  @ApiResponseProperty() message: string;
}

/** Returned to the customer (unauthenticated) — safe subset, no internal fields. */
export class PublicCheckoutPageDto {
  @ApiResponseProperty() id: string;
  @ApiResponseProperty() title: string;
  @ApiResponseProperty() pageDescription: string | null;
  @ApiResponseProperty() logoUrl: string | null;
  @ApiResponseProperty() primaryColor: string;
  @ApiResponseProperty() buttonText: string;
  @ApiResponseProperty() contactMobile: string | null;
  @ApiResponseProperty() contactEmail: string | null;
  @ApiResponseProperty() termsAndConditions: string | null;
  @ApiResponseProperty() amountType: CheckoutAmountType;
  @ApiResponseProperty() fixedAmount: number | null;
  @ApiResponseProperty() minimumAmount: number | null;
  @ApiResponseProperty() collectAddress: boolean;
  @ApiResponseProperty() customFields: CheckoutCustomField[];
  @ApiResponseProperty() successMessage: string | null;
}

/** Returned after customer initiates payment through the page. */
export class CheckoutPagePayResponseDto {
  @ApiResponseProperty() checkoutId: string;
  @ApiResponseProperty() checkoutUrl: string;
  @ApiResponseProperty() message: string;
}
