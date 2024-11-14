import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class GetSettlementListDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;
}
