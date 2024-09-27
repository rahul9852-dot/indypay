import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { Reflector } from "@nestjs/core";
import { appConfig } from "@/config/app.config";
import { IAccessTokenPayload } from "@/interface/common.interface";
import {
  IGNORE_BUSINESS_DETAILS_KEY,
  REQUEST_USER_KEY,
} from "@/constants/auth.constant";
import { COOKIE_KEYS, ONBOARDING_STATUS, USERS_ROLE } from "@/enums";
import { MessageResponseDto } from "@/dtos/common.dto";

const {
  jwtConfig: { accessTokenSecret },
} = appConfig();

@Injectable()
export class BusinessDetailsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ignoreBusinessDetails = this.reflector.getAllAndOverride<boolean>(
      IGNORE_BUSINESS_DETAILS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (ignoreBusinessDetails) return true;

    const request = context.switchToHttp().getRequest();
    const accessToken = this.extractTokenFromCookie(request);

    if (!accessToken) {
      throw new UnauthorizedException();
    }
    try {
      const payload = (await this.jwtService.verifyAsync(accessToken, {
        secret: accessTokenSecret,
      })) as IAccessTokenPayload;

      if ([USERS_ROLE.ADMIN, USERS_ROLE.OWNER].includes(payload.role)) {
        return true;
      }

      if (
        payload.onboardingStatus < ONBOARDING_STATUS.FILLED_BUSINESS_DETAILS
      ) {
        throw new ForbiddenException(
          new MessageResponseDto("Please fill business details first"),
        );
      }

      request[REQUEST_USER_KEY] = payload;
    } catch (err: any) {
      if (err instanceof ForbiddenException) {
        throw err;
      }
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    return request.cookies?.[COOKIE_KEYS.ACCESS_TOKEN];
  }
}
