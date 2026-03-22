import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString, Matches } from "class-validator";
import { Transform } from "class-transformer";

export class AadhaarGenerateOtpDto {
  @ApiProperty({
    description: "12-digit Aadhaar number (digits only, no spaces)",
    example: "123456789012",
  })
  @IsString()
  @Transform(({ value }) =>
    typeof value === "string" ? value.replace(/\s/g, "") : value,
  )
  @Matches(/^\d{12}$/, {
    message: "Invalid Aadhaar format. Must be exactly 12 digits.",
  })
  aadhaarNumber: string;

  @ApiProperty({
    description: "Regulatory consent — must be 'Y'",
    example: "Y",
  })
  @IsIn(["Y"], {
    message:
      "consent must be 'Y'. KYC verification requires explicit user consent.",
  })
  consent: "Y";
}

export class AadhaarVerifyOtpDto {
  @ApiProperty({
    description: "6-digit OTP received on Aadhaar-linked mobile",
    example: "123456",
  })
  @IsString()
  @Matches(/^\d{6}$/, {
    message: "OTP must be exactly 6 digits.",
  })
  otp: string;

  @ApiProperty({
    description: "Reference/request ID returned by the generate-otp endpoint",
    example: "kzra_xxxxxxxxxxxxxxxx",
  })
  @IsString()
  requestId: string;
}
