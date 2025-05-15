import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { ThirdPartyAuthService } from "./third-party-auth.service";

@Injectable()
export class ThirdPartyAuthInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ThirdPartyAuthInterceptor.name);

  constructor(private readonly authService: ThirdPartyAuthService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const apiName = request.headers["x-api-name"];
    if (apiName === "eritech") {
      try {
        const token = await this.authService.getEritechToken();
        request.headers["Authorization"] = `Bearer ${token}`;
      } catch (error) {
        this.logger.error(`Failed to get Eritech auth token: ${error.message}`);
        throw error;
      }
    }

    return next.handle();
  }
}
