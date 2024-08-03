import { Controller, Get, VERSION_NEUTRAL } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SUCCESS_MESSAGES } from "constants/messages.constant";

@ApiTags("Health Check")
@Controller({
  version: VERSION_NEUTRAL,
})
export class AppController {
  @ApiOperation({ summary: "Health Check" })
  @Get("health-check")
  healthCheck(): string {
    return SUCCESS_MESSAGES.HEALTHY;
  }
}
