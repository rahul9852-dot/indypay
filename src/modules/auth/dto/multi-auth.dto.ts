import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length } from "class-validator";

export class VerifyMultiFactorAuthOtpDto {
  @ApiProperty({
    example: "123456",
    description: "6-digit verification code received via SMS",
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  token: string;
}
