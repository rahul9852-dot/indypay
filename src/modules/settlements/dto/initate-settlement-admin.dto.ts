import { ApiProperty, ApiResponseProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { PAYOUT_PAYMENT_MODE, SETTLEMENT_STATUS } from "@/enums/payment.enum";

export class InitiateSettlementAdminDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    enum: PAYOUT_PAYMENT_MODE,
    default: PAYOUT_PAYMENT_MODE.IMPS,
  })
  @IsEnum(PAYOUT_PAYMENT_MODE)
  @IsNotEmpty()
  transferMode: PAYOUT_PAYMENT_MODE;
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
