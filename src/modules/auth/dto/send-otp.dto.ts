import { ApiProperty, ApiResponseProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString, Length } from "class-validator";
import { OTP_TYPE } from "@/enums/otp.enum";

export class SendOtpDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mobile: string;
}

export class VerifyOtpDto extends SendOtpDto {
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
