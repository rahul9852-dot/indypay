import { Controller, Get, VERSION_NEUTRAL } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { successMessages } from "constants/messages";

@ApiTags("Health Check")
@Controller({
  version: VERSION_NEUTRAL,
})
export class AppController {
  @ApiOperation({ summary: "Health Check" })
  @Get("health-check")
  healthCheck(): string {
    return successMessages.healthy;
  }
}
