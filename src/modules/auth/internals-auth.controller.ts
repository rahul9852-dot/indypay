import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";

@ApiTags("Authentication - Internal Users")
@Controller("internals/auth")
export class InternalsAuthController {
  constructor(private readonly _authService: AuthService) {}
}
