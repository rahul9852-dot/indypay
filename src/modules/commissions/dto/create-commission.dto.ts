import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from "class-validator";
import { COMMISSION_TYPE } from "@/enums/commission.enum";

export class CreateCommissionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: COMMISSION_TYPE })
  @IsEnum(COMMISSION_TYPE)
  type: COMMISSION_TYPE;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ default: 18 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  defaultGstPercentage?: number;
}
