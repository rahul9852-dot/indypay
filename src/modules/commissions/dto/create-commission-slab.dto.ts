import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNumber,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  Min,
  ValidateIf,
} from "class-validator";
import { CHARGE_TYPE } from "@/enums/commission.enum";

export class CreateCommissionSlabDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  minAmount: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  @ValidateIf((o) => o.maxAmount !== null)
  maxAmount: number | null;

  @ApiProperty({ enum: CHARGE_TYPE })
  @IsEnum(CHARGE_TYPE)
  chargeType: CHARGE_TYPE;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  chargeValue: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  gstPercentage: number | null;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  priority?: number;
}
