import { Controller, Get, VERSION_NEUTRAL } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { successMessages } from "constants/messages";

@ApiTags("App")
@Controller({
  version: VERSION_NEUTRAL,
})
export class AppController {
  @Get("health-check")
  healthCheck(): string {
    return successMessages.healthy;
  }
}
