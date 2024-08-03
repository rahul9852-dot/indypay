import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { ROLES } from "enums";
import { trimString } from "utils/string.utils";

export class CreateMerchantDto {
  @ApiProperty({ example: "John Doe" })
  @IsString()
  @IsNotEmpty()
  @Transform(trimString)
  fullName: string;

  @ApiProperty({ example: "john@example.com" })
  @IsEmail()
  @IsNotEmpty()
  @Transform(trimString)
  email: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  @IsNotEmpty()
  @Transform(trimString)
  @MinLength(8)
  password: string;

  @ApiProperty({ example: "1234567890" })
  @IsString()
  @IsNotEmpty()
  @Transform(trimString)
  mobile: string;

  @ApiPropertyOptional({ example: "image.png" })
  @IsString()
  @IsOptional()
  image?: string;
}

export class UpdateMerchantDto extends PartialType(CreateMerchantDto) {}

export class LoginMerchantDto {
  @ApiProperty({ example: "john@example.com" })
  @IsEmail()
  @IsNotEmpty()
  @Transform(trimString)
  email: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  @IsNotEmpty()
  @Transform(trimString)
  password: string;
}

export class RolesDto {
  @ApiProperty({ example: 1 })
  @IsEnum(ROLES)
  @IsNotEmpty()
  role: ROLES;
}
