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
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  userId?: string;

  @IsDateString()
  @IsNotEmpty()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsNotEmpty()
  @IsOptional()
  endDate?: string;

  @IsEnum(PAYMENT_STATUS)
  @ApiProperty({
    enum: [
      PAYMENT_STATUS.SUCCESS,
      PAYMENT_STATUS.PENDING,
      PAYMENT_STATUS.FAILED,
    ],
  })
  @IsNotEmpty()
  @IsOptional()
  status?: PAYMENT_STATUS;
}
