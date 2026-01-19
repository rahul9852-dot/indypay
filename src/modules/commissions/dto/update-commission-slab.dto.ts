import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  ValidateIf,
} from "class-validator";
import { CHARGE_TYPE } from "@/enums/commission.enum";

export class UpdateCommissionSlabDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  @ValidateIf((o) => o.maxAmount !== null)
  maxAmount?: number | null;

  @ApiPropertyOptional({ enum: CHARGE_TYPE })
  @IsEnum(CHARGE_TYPE)
  @IsOptional()
  chargeType?: CHARGE_TYPE;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  chargeValue?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  gstPercentage?: number | null;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
