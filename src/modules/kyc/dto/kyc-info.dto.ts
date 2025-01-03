import { IsString, IsEmail } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class KycInfoDto {
  @ApiProperty()
  @IsString()
  personalPan: string;

  @ApiProperty()
  @IsEmail()
  personalEmailId: string;

  @ApiProperty()
  @IsString()
  businessType: string;
}
