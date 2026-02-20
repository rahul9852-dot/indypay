import { ApiProperty, ApiResponseProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from "class-validator";
import { OTP_TYPE } from "@/enums/otp.enum";

export class SendOtpDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  mobile?: string;
}

export class VerifyOtpDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  mobile?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}

export class ReSendOtpDto extends SendOtpDto {}

export class OtpTypeDto {
  @ApiProperty({
    example: OTP_TYPE.MOBILE,
    enum: [OTP_TYPE.MOBILE, OTP_TYPE.EMAIL],
  })
  @IsEnum(OTP_TYPE)
  type: OTP_TYPE;
}

export class SendOtpResDto {
  @ApiResponseProperty({
    example: "otp_23493fcnjks",
  })
  id: string;

  @ApiResponseProperty({
    example: "9999999999",
  })
  mobile: string;

  @ApiResponseProperty({
    example: "123456",
  })
  otp: string;
}
