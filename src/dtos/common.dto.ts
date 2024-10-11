import { ApiPropertyOptional, ApiResponseProperty } from "@nestjs/swagger";
import { IsNumberString, IsOptional, IsString } from "class-validator";

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

export class PaginationWithoutSortAndOrderDto {
  @ApiPropertyOptional()
  @IsNumberString()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @IsNumberString()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;
}

export class PaginationDto extends PaginationWithoutSortAndOrderDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sort?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  order?: "ASC" | "DESC";
}
