import { ApiProperty } from "@nestjs/swagger";

export class PaymentResponseDto {
  @ApiProperty({ description: "Client code" })
  clientCode: string;

  @ApiProperty({ description: "Encrypted response data from payment gateway" })
  encResponse: string;
}
