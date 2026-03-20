import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, IsIn } from "class-validator";
import { Transform } from "class-transformer";

export class PanVerifyDto {
  @ApiProperty({
    description: "PAN card number (10 characters, e.g. ABCDE1234F)",
    example: "ABCDE1234F",
  })
  @IsString()
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase().trim() : value,
  )
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
    message: "Invalid PAN format. Expected format: ABCDE1234F",
  })
  pan: string;

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
