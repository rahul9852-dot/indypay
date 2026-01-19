import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
} from "class-validator";
import { COMMISSION_TYPE } from "@/enums/commission.enum";

export class UpdateCommissionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: COMMISSION_TYPE })
  @IsEnum(COMMISSION_TYPE)
  @IsOptional()
  type?: COMMISSION_TYPE;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  defaultGstPercentage?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
