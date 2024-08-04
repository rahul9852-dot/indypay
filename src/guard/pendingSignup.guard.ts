import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { appConfig } from "config/app.config";
import { COOKIE_KEYS, ID_TYPE } from "enums";
import { IPendingSignUpPayload } from "interface/common.interface";

const {
  jwtConfig: { pendingSignUpTokenSecret },
} = appConfig();

@Injectable()
export class PendingSignupGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const accessToken = this.extractTokenFromHeader(request);

    if (!accessToken) {
      throw new UnauthorizedException();
    }
    try {
      const payload = (await this.jwtService.verifyAsync(accessToken, {
        secret: pendingSignUpTokenSecret,
      })) as IPendingSignUpPayload;

      const [idType] = payload.id.split("_");

      if (idType !== ID_TYPE.MERCHANT) {
        throw new ForbiddenException();
      }

      request["user"] = payload;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const accessToken = request.cookies[COOKIE_KEYS.PENDING_SIGN_UP];

    return accessToken;
  }
}
