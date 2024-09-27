import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { USERS_ROLE } from "@/enums";

export class ChangeRoleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    enum: USERS_ROLE,
    default: USERS_ROLE.MERCHANT,
  })
  @IsNotEmpty()
  @IsEnum(USERS_ROLE)
  role: USERS_ROLE;
}
