import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  Length,
} from "class-validator";

export class SendSignupOtpDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  email?: string;

  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  @Length(10, 10)
  mobile: string;
}
