import { ApiProperty, ApiResponseProperty } from "@nestjs/swagger";
import { IsObject, IsString } from "class-validator";

export class VerifyTokenDto {
  @ApiProperty()
  @IsString()
  clientId: string;

  @ApiProperty()
  @IsString()
  clientSecret: string;

  @ApiProperty()
  @IsString()
  token: string;
}

export class GenerateUrlResponseDto {
  @ApiResponseProperty()
  @IsString()
  url: string;
}

export class UserResponseDto {
  @ApiResponseProperty()
  id: string;
  @ApiResponseProperty()
  fullName: string;
  @ApiResponseProperty()
  email: string;
  @ApiResponseProperty()
  mobile: string;
  @ApiResponseProperty()
  role: number;
  @ApiResponseProperty()
  accountStatus: number;
}

export class VerifyTokenResponseDto {
  @ApiResponseProperty()
  @IsObject()
  user: UserResponseDto;
}
