import { ApiResponseProperty } from "@nestjs/swagger";
import { IsDate, IsNotEmpty, IsString } from "class-validator";

export class CheckoutDto {
  @ApiResponseProperty()
  @IsString()
  @IsNotEmpty()
  payerName: string;

  @ApiResponseProperty()
  @IsString()
  @IsNotEmpty()
  payerEmail: string;

  @ApiResponseProperty()
  @IsString()
  @IsNotEmpty()
  payerMobile: string;

  @ApiResponseProperty()
  @IsString()
  @IsNotEmpty()
  payerAddress: string;

  @ApiResponseProperty()
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiResponseProperty()
  @IsString()
  @IsNotEmpty()
  callbackUrl: string;

  @ApiResponseProperty()
  @IsString()
  @IsNotEmpty()
  mcc: string;

  @ApiResponseProperty()
  @IsString()
  @IsNotEmpty()
  channelId: string;

  @ApiResponseProperty()
  @IsDate()
  @IsNotEmpty()
  transDate: Date;

  @ApiResponseProperty()
  @IsString()
  @IsNotEmpty()
  transUserName: string;

  @ApiResponseProperty()
  @IsString()
  @IsNotEmpty()
  transUserPassword: string;

  @ApiResponseProperty()
  @IsString()
  @IsNotEmpty()
  clientCode: string;

  @ApiResponseProperty()
  @IsString()
  @IsNotEmpty()
  clientTxnId: string;
}
