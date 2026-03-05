import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ContactUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  businessType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  organizationName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mobileNumber: string;
}
