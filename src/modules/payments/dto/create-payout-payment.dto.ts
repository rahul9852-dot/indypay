import { ApiProperty, ApiResponseProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  ValidateNested,
} from "class-validator";
import { PAYMENT_STATUS, PAYOUT_PAYMENT_MODE } from "@/enums/payment.enum";

export class CreatePayoutTransactionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty()
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @IsPositive()
  amount: number;

  @ApiProperty()
  @IsEnum(PAYOUT_PAYMENT_MODE)
  @ApiProperty({ enum: PAYOUT_PAYMENT_MODE, example: PAYOUT_PAYMENT_MODE.IMPS })
  @IsNotEmpty()
  transferMode: PAYOUT_PAYMENT_MODE;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  industryType: string;

  // Beneficiary Details

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  beneficiaryName: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  beneficiaryEmail: string;

  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  @Length(10, 10)
  beneficiaryMobile: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  beneficiaryBankName: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  beneficiaryBankAccount: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  beneficiaryBankIFSC: string;
}

export class PayoutStatusDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orderId: string;
}

export class CreatePayoutPaymentResponseDto {
  @ApiResponseProperty({
    enum: PAYMENT_STATUS,
    example: PAYMENT_STATUS.PENDING,
  })
  status: PAYMENT_STATUS;

  @ApiResponseProperty()
  transferId: string;
}

// Ismart

export class SinglePayoutIsmartDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  purpose: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  beneficiaryName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ifscCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  remarks: string;

  @ApiProperty({ enum: PAYOUT_PAYMENT_MODE })
  @IsEnum(PAYOUT_PAYMENT_MODE)
  @IsNotEmpty()
  @IsOptional()
  paymentMode?: PAYOUT_PAYMENT_MODE;
}
export class CreatePayoutIsmartDto {
  @ApiProperty({
    type: [SinglePayoutIsmartDto],
    description: "Array of payout data",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SinglePayoutIsmartDto)
  data: SinglePayoutIsmartDto[];
}
