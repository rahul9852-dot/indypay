import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { appConfig } from "@/config/app.config";
import { CustomLogger } from "@/logger";

const {
  externalPaymentConfig: { webhookIps },
} = appConfig();
@Injectable()
export class WebhookGuard implements CanActivate {
  logger = new CustomLogger(WebhookGuard.name);
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    this.logger.info(`request ip: ${request.ip}`);

    // if (!webhookIps.includes(request.ip)) {
    //   throw new UnauthorizedException();
    // }

    return true;
  }
}
