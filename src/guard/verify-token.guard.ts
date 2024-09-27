import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { appConfig } from "@/config/app.config";
import { IAccessTokenPayload } from "@/interface/common.interface";
import { REQUEST_USER_KEY } from "@/constants/auth.constant";
import { COOKIE_KEYS } from "@/enums";

const {
  jwtConfig: { accessTokenSecret },
} = appConfig();

@Injectable()
export class VerifyTokenGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const verifyToken = this.extractTokenFromCookie(request);

    if (!verifyToken) {
      throw new UnauthorizedException();
    }
    try {
      const payload = (await this.jwtService.verifyAsync(verifyToken, {
        secret: accessTokenSecret,
      })) as IAccessTokenPayload;

      request[REQUEST_USER_KEY] = payload;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    return request.cookies?.[COOKIE_KEYS.VERIFY_TOKEN];
  }
}
