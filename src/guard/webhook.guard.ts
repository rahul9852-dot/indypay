import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Request } from "express";
import { appConfig } from "@/config/app.config";
import { CustomLogger } from "@/logger";

const {
  externalPaymentConfig: { webhookIps, encryptionSalt, aesSecretKey },
} = appConfig();
@Injectable()
export class WebhookGuard implements CanActivate {
  logger = new CustomLogger(WebhookGuard.name);
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const requestIp = this.parseIp(request);

    this.logger.info(`request ip: ${requestIp}`);

    if (!webhookIps.includes(requestIp)) {
      throw new ForbiddenException("Invalid IP address");
    }

    return true;
  }

  private parseIp(req: Request) {
    const xForwardedFor = req.headers["x-forwarded-for"];
    if (
      xForwardedFor &&
      Array.isArray(xForwardedFor) &&
      xForwardedFor.length > 0
    ) {
      return xForwardedFor[0];
    } else if (xForwardedFor && typeof xForwardedFor === "string") {
      return xForwardedFor;
    }

    return req.socket?.remoteAddress || req.ip;
  }
}
