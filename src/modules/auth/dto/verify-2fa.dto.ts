import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length } from "class-validator";

export class Verify2FADto {
  @ApiProperty({
    description: "The 6-digit verification code received via SMS",
    example: "123456",
  })
  @IsString({ message: "Verification code must be a string" })
  @IsNotEmpty({ message: "Verification code is required" })
  @Length(6, 6, { message: "Verification code must be exactly 6 digits" }) // min 6 & max 6
  // @Matches(/^\d{6}$/, { message: 'Verification code must be exactly 6 digits' })
  token: string;
}
