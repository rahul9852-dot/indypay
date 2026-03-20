import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Request } from "express";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";
import { getCurrentUserIp } from "@/utils/request.utils";

@Injectable()
export class WebhookGuard implements CanActivate {
  logger = new CustomLogger(WebhookGuard.name);
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // S-3 fix: use req.ip resolved by Express trust-proxy (trust proxy = 1 in
    // main.ts). This uses the rightmost XFF IP set by our load balancer — the
    // real client IP — rather than the leftmost value which an attacker controls.
    const requestIp = getCurrentUserIp(request);

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
}
