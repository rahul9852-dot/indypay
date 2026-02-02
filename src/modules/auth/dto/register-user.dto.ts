import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { USERS_ROLE } from "@/enums";

export class RegisterUserDto {
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
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mobile: string;

  @ApiPropertyOptional({
    enum: [USERS_ROLE.MERCHANT, USERS_ROLE.CHANNEL_PARTNER],
    default: USERS_ROLE.MERCHANT,
  })
  @IsOptional()
  @IsEnum([USERS_ROLE.MERCHANT, USERS_ROLE.CHANNEL_PARTNER])
  @IsNotEmpty()
  role?: USERS_ROLE.MERCHANT | USERS_ROLE.CHANNEL_PARTNER;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  channelPartnerId?: string;
}

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  googleToken: string;
}
