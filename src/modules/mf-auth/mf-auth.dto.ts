import { ApiProperty, ApiResponseProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class VerifyCodeDto {
  @ApiProperty({ example: "123456" })
  @IsString()
  @Length(6, 6)
  token: string;

  @ApiProperty({ example: "KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLX" })
  @IsString()
  @IsNotEmpty()
  secret: string;
}

export class GenerateQRcodeDto {
  @ApiProperty({ example: "vivekartist9999@gmail.com" })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class GenerateQRcodeResponseDto {
  @ApiResponseProperty()
  qrCode: string;
}
