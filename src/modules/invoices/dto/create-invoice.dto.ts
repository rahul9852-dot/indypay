import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { ItemQuantityDto } from "@/modules/items/dto/item.quantity.dto";

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
}
