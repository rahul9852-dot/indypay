import { Controller, Get, VERSION_NEUTRAL } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Public } from "./decorators/public.decorator";
import { IgnoreBusinessDetails } from "./decorators/ignore-business-details.decorator";
import { IgnoreKyc } from "./decorators/ignore-kyc.decorator";
import { SUCCESS_MESSAGES } from "@/constants/messages.constant";

@Public()
@IgnoreBusinessDetails()
@IgnoreKyc()
@ApiTags("Health Check")
@Controller({
  version: VERSION_NEUTRAL,
})
export class AppController {
  @ApiOperation({ summary: "Health Check" })
  @ApiResponse({ status: 200, description: SUCCESS_MESSAGES.HEALTHY })
  @Get("health-check")
  healthCheck(): string {
    return SUCCESS_MESSAGES.HEALTHY;
  }
}
