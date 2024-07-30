import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { trimString } from "utils/string.utils";

export class CreateUserDto {
  @ApiProperty({ example: "John Doe" })
  @IsString()
  @IsNotEmpty()
  @Transform(trimString)
  name: string;

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
  contactNo: string;

  @ApiPropertyOptional({ example: "image.png" })
  @IsString()
  @IsOptional()
  image?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class LoginUserDto {
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
