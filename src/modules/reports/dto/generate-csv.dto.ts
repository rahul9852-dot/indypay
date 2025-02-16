import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PAYMENT_STATUS } from "@/enums/payment.enum";

export class GeneratePayinReportDto {
  @ApiProperty({
    description: "User ID for filtering reports",
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: "Start date for filtering reports (ISO format)",
    required: false,
    example: "2025-02-16T00:00:00.000Z",
  })
  @IsDateString()
  @IsNotEmpty()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: "End date for filtering reports (ISO format)",
    required: false,
    example: "2025-02-16T23:59:59.999Z",
  })
  @IsDateString()
  @IsNotEmpty()
  @IsOptional()
  endDate?: string;

  @IsEnum(PAYMENT_STATUS)
  @ApiProperty({
    enum: PAYMENT_STATUS,
    description:
      "Filter by payment status. If not provided, will return all statuses",
    required: false,
  })
  @IsOptional()
  status?: PAYMENT_STATUS;
}
