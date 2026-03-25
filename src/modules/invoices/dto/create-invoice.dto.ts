import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { ItemQuantityDto } from "@/modules/items/dto/item.quantity.dto";
import { RecurringFrequency } from "@/entities/invoice.entity";

export class RecurringConfigDto {
  @ApiProperty({ enum: ["WEEKLY", "MONTHLY", "QUARTERLY"] })
  @IsEnum(["WEEKLY", "MONTHLY", "QUARTERLY"])
  frequency: RecurringFrequency;

  @ApiProperty({ example: 1, description: "Repeat every N frequency units" })
  @IsInt()
  @Min(1)
  interval: number;

  @ApiPropertyOptional({ example: "2026-12-31" })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CreateInvoiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  id?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: "Invoice number cannot exceed 50 characters." })
  invoiceNumber?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive({ message: "Total amount must be a positive number." })
  @IsOptional()
  totalAmount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerNotes?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  termsAndServices?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingAddress?: string;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  issueDate?: Date;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  expiryDate?: Date;

  @ApiProperty({
    type: [ItemQuantityDto],
    description: "List of items and their quantities included in the invoice",
  })
  @IsArray()
  @IsOptional()
  @ArrayMinSize(1, { message: "At least one item must be selected." })
  @ValidateNested({ each: true })
  @Type(() => ItemQuantityDto)
  items?: ItemQuantityDto[];

  @ApiPropertyOptional({
    default: false,
    description:
      "When true, this invoice auto-repeats according to recurringConfig.",
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({
    description: "Required when isRecurring = true.",
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RecurringConfigDto)
  recurringConfig?: RecurringConfigDto;
}
