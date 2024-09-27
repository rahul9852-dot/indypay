import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class WebhookUrlDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  payInWebhookUrl?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  payOutWebhookUrl?: string;
}
