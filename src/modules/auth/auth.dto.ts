import { ApiProperty, ApiResponseProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class GenerateTokenDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  token: string;
}

export class VerifyTokenDto extends GenerateTokenDto {}

export class VerifyTokenResponse {
  @ApiResponseProperty()
  isValidToken: boolean;

  @ApiResponseProperty()
  merchantId: number;
}

export class MessageResponse {
  @ApiResponseProperty()
  message: string;
}
