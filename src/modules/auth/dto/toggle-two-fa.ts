import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class Update2FAStatusDto {
  @ApiProperty({
    description: "The ID of the user whose 2FA status to toggle",
    example: "usr_01GB1QXN9QXQ2GZVQKJNYY0H0M",
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: "The new status of the user's 2FA",
    example: false,
  })
  @IsBoolean()
  isEnabled: boolean;
}
