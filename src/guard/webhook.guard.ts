import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Request } from "express";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";

@Injectable()
export class WebhookGuard implements CanActivate {
  logger = new CustomLogger(WebhookGuard.name);
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const requestIp = this.parseIp(request);

    this.logger.info(`WEBHOOK REQUEST : ${LoggerPlaceHolder.Json}`, {
      requestIp,
      requestBody: request.body,
    });

    // Populate this list when new payment gateways are integrated.
    // Each gateway should supply its own IP allowlist via environment variables.
    const webhookIps: string[] = [];

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
