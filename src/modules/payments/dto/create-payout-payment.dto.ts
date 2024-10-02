import { ApiProperty, ApiResponseProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsPositive,
  IsString,
  Length,
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
