import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { ACCOUNT_STATUS } from "@/enums";

export class ChangeStatusDto {
  @ApiProperty({
    enum: ACCOUNT_STATUS,
    default: ACCOUNT_STATUS.BLOCKED,
  })
  @IsNotEmpty()
  @IsEnum(ACCOUNT_STATUS)
  status: ACCOUNT_STATUS;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  userId: string;
}
