import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { MfAuthService } from "./mf-auth.service";
import { GenerateQRcodeDto } from "./mf-auth.dto";

@ApiTags("Multi Factor Authentication")
@Controller("mf-auth")
export class MfAuthController {
  constructor(private readonly _mfAuthService: MfAuthService) {}

  @ApiOperation({ summary: "Generate QRcode" })
  @Post("generate-qr")
  generateQRcode(@Body() generateQRcodeDto: GenerateQRcodeDto) {
    return this._mfAuthService.generateQRcode(generateQRcodeDto);
  }
}
