import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString, IsString } from "class-validator";

export class AddAddressDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  pincode: string;
}

export class AddAddressAdminDto extends AddAddressDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;
}
