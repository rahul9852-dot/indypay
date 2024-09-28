import { IsDateString, IsEnum, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PAYMENT_TYPE } from "@/enums/payment.enum";

export class DownloadCsvDto {
  @ApiProperty({ default: PAYMENT_TYPE.PAYIN })
  @IsNotEmpty()
  @IsEnum(PAYMENT_TYPE)
  transactionType: PAYMENT_TYPE;

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsDateString()
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsDateString()
  @IsOptional()
  endDate?: Date;
}
