import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString, Matches } from "class-validator";
import { Transform } from "class-transformer";

export class BankVerifyDto {
  @ApiProperty({
    description: "Bank account number (9–18 digits)",
    example: "9876543210",
  })
  @IsString()
  @Matches(/^\d{9,18}$/, {
    message: "Invalid account number. Must be 9–18 digits.",
  })
  accountNumber: string;

  @ApiProperty({
    description: "Bank IFSC code (11 characters)",
    example: "HDFC0000001",
  })
  @IsString()
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase().trim() : value,
  )
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, {
    message: "Invalid IFSC format. Expected format: ABCD0XXXXXX",
  })
  ifsc: string;

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
