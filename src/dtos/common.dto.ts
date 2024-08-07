import { ApiPropertyOptional, ApiResponseProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class ValidationErrorDto {
  @ApiResponseProperty({ example: ["email must be an email"] })
  message: string[];

  @ApiResponseProperty({ example: 400 })
  statusCode: number;

  @ApiResponseProperty({ example: "Bad Request" })
  error: string;
}

export class MessageResponseDto {
  constructor(message: string) {
    this.message = message;
  }
  @ApiResponseProperty()
  message: string;
}

export class PaginationDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sort?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  order?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;
}
