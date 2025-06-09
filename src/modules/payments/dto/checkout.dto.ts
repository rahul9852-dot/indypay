import { ApiResponseProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CheckoutDto {
  @ApiResponseProperty()
  @IsString()
  @IsNotEmpty()
  payerName?: string;

  @ApiResponseProperty()
  @IsString()
  @IsNotEmpty()
  payerEmail?: string;

  @ApiResponseProperty()
  @IsString()
  @IsNotEmpty()
  payerMobile?: string;

  @ApiResponseProperty()
  @IsString()
  @IsNotEmpty()
  payerAddress?: string;

  @ApiResponseProperty()
  @IsString()
  @IsNotEmpty()
  amount?: string;

  @ApiResponseProperty()
  @IsString()
  @IsNotEmpty()
  channelId?: string;

  @ApiResponseProperty()
  @IsString()
  @IsNotEmpty()
  transDate?: string;
}
