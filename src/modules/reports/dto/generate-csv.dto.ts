import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { PAYMENT_STATUS } from "@/enums/payment.enum";

export class GenerateReportDto {
  @ApiPropertyOptional({
    description: "User ID for filtering reports",
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: "Start date for filtering reports (ISO format)",
    example: "2025-02-16T00:00:00.000Z",
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: "End date for filtering reports (ISO format)",
    required: false,
    example: "2025-02-16T23:59:59.999Z",
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(PAYMENT_STATUS)
  @ApiPropertyOptional({
    enum: PAYMENT_STATUS,
    description:
      "Filter by payment status. If not provided, will return all statuses",
    required: false,
  })
  @IsOptional()
  status?: PAYMENT_STATUS;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  from?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  count?: number;
}
