import {
  ApiProperty,
  ApiPropertyOptional,
  ApiResponseProperty,
} from "@nestjs/swagger";
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

export class PayoutStatusMerchantDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  payoutId: string;
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

export class SinglePayoutDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  // @ApiProperty()
  // @IsString()
  // @IsNotEmpty()
  // custUniqRef: string;

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
  bankName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ifscCode: string;

  // @ApiProperty()
  // @IsNumberString()
  // @IsNotEmpty()
  // mobile: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  remarks: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  payoutId?: string;

  @ApiProperty({ enum: PAYOUT_PAYMENT_MODE })
  @IsEnum(PAYOUT_PAYMENT_MODE)
  @IsNotEmpty()
  @IsOptional()
  paymentMode?: PAYOUT_PAYMENT_MODE;
}
export class CreatePayoutDto {
  @ApiProperty({
    type: [SinglePayoutDto],
    description: "Array of payout data",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SinglePayoutDto)
  data: SinglePayoutDto[];
}
