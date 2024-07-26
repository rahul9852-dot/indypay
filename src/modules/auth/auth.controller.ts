import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get("sign-up")
  @ApiOperation({ summary: "Sign up" })
  async signUp() {
    return this.authService.signUp();
  }
}
