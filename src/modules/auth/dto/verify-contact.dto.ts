import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
  IsBoolean,
} from "class-validator";

export class VerifyContactDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(10, 10)
  mobile: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  confirmPassword: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  mobileOtp: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  emailOtp: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  termsAccepted: boolean;

  @ApiProperty()
  @IsBoolean()
  whatsappAlerts: boolean;
}

export class VerifyOtpContactDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mobile: string;

  // @ApiProperty()
  // @IsEmail()
  // @IsNotEmpty()
  // email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  mobileOtp: string;

  // @ApiProperty()
  // @IsString()
  // @IsNotEmpty()
  // @Length(6, 6)
  // emailOtp: string;
}
