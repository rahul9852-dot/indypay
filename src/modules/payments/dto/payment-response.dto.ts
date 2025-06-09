import { ApiProperty } from "@nestjs/swagger";

export class PaymentResponseDto {
  @ApiProperty({ description: "Encrypted response data from payment gateway" })
  encData: string;
}
