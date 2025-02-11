import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { Reflector } from "@nestjs/core";
import { appConfig } from "@/config/app.config";
import { IVerifyMobilePayload } from "@/interface/common.interface";
import {
  IGNORE_MOBILE_VERIFICATION_KEY,
  MOBILE_INFO_KEY,
} from "@/constants/auth.constant";
import { COOKIE_KEYS } from "@/enums";

const {
  jwtConfig: { accessTokenSecret },
} = appConfig();

@Injectable()
export class VerifyMobileGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ignoreMobileVerification = this.reflector.getAllAndOverride<boolean>(
      IGNORE_MOBILE_VERIFICATION_KEY,
      [context.getHandler(), context.getClass()],
    );
    const request = context.switchToHttp().getRequest<Request>();
    const verifyToken = this.extractTokenFromCookie(request);
    if (!verifyToken) {
      throw new UnauthorizedException();
    }
    try {
      const payload = (await this.jwtService.verifyAsync(verifyToken, {
        secret: accessTokenSecret,
      })) as IVerifyMobilePayload;

      if (ignoreMobileVerification) {
        request[MOBILE_INFO_KEY] = payload;
      } else if (!ignoreMobileVerification && !payload.isVerified) {
        throw new ForbiddenException("Mobile number is not verified");
      }

      request[MOBILE_INFO_KEY] = payload;
      // if (request.body?.mobile !== payload.mobile)
      //   throw new UnprocessableEntityException("Mobile number does not match");
    } catch (err: any) {
      if (
        err instanceof UnprocessableEntityException ||
        err instanceof ForbiddenException
      ) {
        throw err;
      }
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    return request.cookies?.[COOKIE_KEYS.MOBILE_INFO_KEY];
  }
}
