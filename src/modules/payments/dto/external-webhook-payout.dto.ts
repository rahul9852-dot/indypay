import { IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PayoutWebhookResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  @IsString()
  status: "SUCCESS" | "PENDING" | "FAILED"; // add more if needed

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty()
  @IsString()
  beneficiaryName: string;
  @ApiProperty()
  @IsString()
  accountNumber: string;
  @ApiProperty()
  @IsString()
  ifscCode: string;
  @ApiProperty()
  @IsString()
  bankName: string;
  @ApiProperty()
  @IsString()
  mobileNumber: string | null;
  @ApiProperty()
  @IsString()
  apiTxnId: string;
  @ApiProperty()
  @IsString()
  opRefId: string | null;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  balance: number | null;

  @ApiProperty()
  @IsString()
  @IsOptional()
  utr: string;
}
