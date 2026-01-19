import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";
import { PaginationDto } from "@/dtos/common.dto";
import { MODE_OPTIONS, PAYIN_WALLET_LOAD_STATUS } from "@/enums/payment.enum";

export class WalletTopUpDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class WalletPayinTopUpDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  topUpId?: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @IsOptional()
  amount?: number;

  @ApiProperty()
  @IsOptional()
  @IsEnum(PAYIN_WALLET_LOAD_STATUS)
  status?: PAYIN_WALLET_LOAD_STATUS;

  @ApiProperty()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  masterBankId?: string;

  @ApiProperty()
  @IsEnum(MODE_OPTIONS)
  @IsOptional()
  mode?: MODE_OPTIONS;

  @ApiProperty()
  @IsString()
  @IsOptional()
  utr?: string;
}

export class WalletListDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  walletId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mobile: string;
}

export class RefundWalletDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;
}

export class PayinTopUpWalletPaginationDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: PAYIN_WALLET_LOAD_STATUS,
    description: "Filter by status",
  })
  @IsEnum(PAYIN_WALLET_LOAD_STATUS)
  @IsOptional()
  status?: PAYIN_WALLET_LOAD_STATUS;
}
