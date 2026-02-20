import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import {
  CheckoutAmountType,
  CheckoutPageStatus,
} from "@/entities/checkout-page.entity";

export class CheckoutCustomFieldDto {
  @ApiProperty()
  @IsString()
  key: string;

  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty({ example: "text" })
  @IsString()
  type: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  required: boolean;
}

export class CreateCheckoutPageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description:
      "Page description. Accepts HTML from rich text editor (bold, italic, underline, lists, etc.).",
  })
  @IsOptional()
  @IsString()
  pageDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactMobile?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional({
    description:
      "Terms and conditions. Accepts HTML from rich text editor (bold, italic, underline, links, etc.).",
  })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiProperty({
    enum: CheckoutAmountType,
    default: CheckoutAmountType.USER_ENTERED,
  })
  @IsEnum(CheckoutAmountType)
  amountType: CheckoutAmountType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedAmount?: number | null;

  @ApiPropertyOptional({ type: [CheckoutCustomFieldDto], default: [] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutCustomFieldDto)
  customFields?: CheckoutCustomFieldDto[];

  @ApiPropertyOptional({
    enum: CheckoutPageStatus,
    default: CheckoutPageStatus.DRAFT,
    description: "Use DRAFT for save draft, PUBLISHED to publish",
  })
  @IsOptional()
  @IsEnum(CheckoutPageStatus)
  status?: CheckoutPageStatus;
}

export class UpdateCheckoutPageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: "Page description. Accepts HTML from rich text editor.",
  })
  @IsOptional()
  @IsString()
  pageDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactMobile?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional({
    description: "Terms and conditions. Accepts HTML from rich text editor.",
  })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiPropertyOptional({ enum: CheckoutAmountType })
  @IsOptional()
  @IsEnum(CheckoutAmountType)
  amountType?: CheckoutAmountType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedAmount?: number | null;

  @ApiPropertyOptional({ type: [CheckoutCustomFieldDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutCustomFieldDto)
  customFields?: CheckoutCustomFieldDto[];

  @ApiPropertyOptional({
    enum: CheckoutPageStatus,
    description: "DRAFT = save draft, PUBLISHED = publish",
  })
  @IsOptional()
  @IsEnum(CheckoutPageStatus)
  status?: CheckoutPageStatus;
}
