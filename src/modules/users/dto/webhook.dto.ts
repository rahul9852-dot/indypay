import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, ValidateIf } from "class-validator";

export class WebhookUrlDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ValidateIf((o) => !o.payOutWebhookUrl) // Validates only if payOutWebhookUrl is absent
  payInWebhookUrl?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ValidateIf((o) => !o.payInWebhookUrl) // Validates only if payInWebhookUrl is absent
  payOutWebhookUrl?: string;
}
