import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class UpdateUserIntegrationDto {
  @ApiProperty({
    description: "Integration code (e.g., ONIK, FYNTRA, GEOPAY, UTKARSH)",
    example: "ONIK",
  })
  @IsString()
  @IsNotEmpty()
  integrationCode: string;
}
