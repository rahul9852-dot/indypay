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
