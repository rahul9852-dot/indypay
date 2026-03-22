import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString, Matches } from "class-validator";
import { Transform } from "class-transformer";

export class GstVerifyDto {
  @ApiProperty({
    description: "15-character GSTIN (e.g. 29AABCT1332L1ZD)",
    example: "29AABCT1332L1ZD",
  })
  @IsString()
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase().trim() : value,
  )
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message:
      "Invalid GSTIN format. Expected format: 29AABCT1332L1ZD (15 characters).",
  })
  gstin: string;

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
