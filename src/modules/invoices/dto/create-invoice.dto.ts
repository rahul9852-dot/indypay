import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";

export class CreateInvoiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  id?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  totalAmount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerNotes?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  termsAndServices: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingAddress?: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  issueDate: Date;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  expiryDate: Date;
}
