import { IsNotEmpty, IsNumberString, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AddBankDetailsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsNumberString()
  @IsNotEmpty()
  mobile: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bankIFSC: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  accountNumber: string;
}

export class AddBankDetailsAdminDto extends AddBankDetailsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;
}
