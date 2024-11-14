import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";

export class GetSettlementListDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    enum: ["UNSETTLED", "SETTLED", "COLLECTIONS"],
  })
  @IsEnum(["UNSETTLED", "SETTLED", "COLLECTIONS"])
  @IsOptional()
  status?: "UNSETTLED" | "SETTLED" | "COLLECTIONS";

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: Date;
}
