import { ApiProperty, ApiResponseProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class AddWhitelistIpsMerchantDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ipAddress: string;
}

export class AddWhitelistIpsDto extends AddWhitelistIpsMerchantDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class DeleteWhitelistIpsMerchantDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ipAddress: string;
}

export class DeleteWhitelistIpsDto extends DeleteWhitelistIpsMerchantDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class WhitelistIpsResponseDto {
  @ApiResponseProperty()
  id: string;

  @ApiResponseProperty()
  ipAddress: string;

  @ApiResponseProperty()
  createdAt: Date;

  @ApiResponseProperty()
  updatedAt: Date;
}
