import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsObject,
  Min,
} from "class-validator";

export class CreateIntegrationDto {
  @ApiProperty({
    description: "Integration name (e.g., 'Onik Payments', 'Fyntra Pay')",
    example: "Onik Payments",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description:
      "Integration code (e.g., 'ONIK', 'FYNTRA', 'GEOPAY') - must be unique",
    example: "ONIK",
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({
    description:
      "Integration-specific configuration (API keys, endpoints, etc.)",
    example: { apiKey: "xxx", apiUrl: "https://api.example.com" },
  })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Whether the integration is active",
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: "Daily limit for this integration",
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  dailyLimit?: number;

  @ApiPropertyOptional({
    description: "Monthly limit for this integration",
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  monthlyLimit?: number;
}
