import {
  ApiProperty,
  ApiPropertyOptional,
  ApiResponseProperty,
} from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumberString, IsString } from "class-validator";
import { PAYOUT_PAYMENT_MODE, SETTLEMENT_STATUS } from "@/enums/payment.enum";

export class InitiateSettlementAdminDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bankId: string;

  @ApiPropertyOptional({
    enum: PAYOUT_PAYMENT_MODE,
    default: PAYOUT_PAYMENT_MODE.IMPS,
  })
  @IsEnum(PAYOUT_PAYMENT_MODE)
  transferMode?: PAYOUT_PAYMENT_MODE;

  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  amount: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  remarks: string;
}

export class PayoutStatusDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orderId: string;
}

export class InitiateSettlementAdminResponseDto {
  @ApiResponseProperty({
    enum: SETTLEMENT_STATUS,
    example: SETTLEMENT_STATUS.NOT_INITIATED,
  })
  status: SETTLEMENT_STATUS;

  @ApiResponseProperty()
  orderId: string;
}
