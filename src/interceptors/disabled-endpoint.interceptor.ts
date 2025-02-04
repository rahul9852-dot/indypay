import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { DISABLED_ENDPOINT_KEY } from "@/constants/auth.constant";

@Injectable()
export class DisabledEndpointInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isDisabled = this.reflector.get<boolean>(
      DISABLED_ENDPOINT_KEY,
      context.getHandler(),
    );
    if (isDisabled) {
      throw new UnauthorizedException(
        "This API endpoint is disabled. Please contact support.",
      );
    }

    return next.handle();
  }
}
