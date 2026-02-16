import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class AssignCommissionToUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  payinCommissionId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  payoutCommissionId?: string | null;
}

export interface CommissionPlanCacheDTO {
  id: string;
  isActive: boolean;
  slabs: {
    id: string;
    commissionId: string;
    minAmount: number;
    maxAmount: number;
    chargeType: string;
    chargeValue: number;
    gstPercentage: number;
    priority: number;
    isActive: boolean;
  }[];
}
