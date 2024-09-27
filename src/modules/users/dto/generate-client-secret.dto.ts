import { ApiProperty, ApiResponseProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length } from "class-validator";

export class GenerateClientSecretDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(10, 10)
  mobile: string;
}

export class GenerateClientSecretResponseDto {
  @ApiResponseProperty()
  mobile: string;

  @ApiResponseProperty()
  clientId: string;

  @ApiResponseProperty()
  clientSecret: string;
}
