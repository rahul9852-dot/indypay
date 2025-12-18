import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Request } from "express";
import { appConfig } from "@/config/app.config";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";

// import { CustomLogger, LoggerPlaceHolder } from "@/logger";

const {
  externalPaymentConfig: {
    flakPay,
    ismart,
    paynpro,
    ertech,
    kdsPayout,
    buckbox,
    rocky,
  },
  utkarsh: { webhookIps: utkarshWebhookIps },
  payboltCreds: { webhookIps: payboltWebhookIps },
  tpipay: { webhookIps: tpiWebhookIps },
  geopay,
  onik,
} = appConfig();
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

    const webhookIps = [
      ...flakPay.webhookIps,
      ...ismart.webhookIps,
      ...paynpro.webhookIps,
      ...ertech.webhookIps,
      ...utkarshWebhookIps,
      ...payboltWebhookIps,
      ...tpiWebhookIps,
      ...geopay.webhookips,
      ...kdsPayout.kdsIp,
      ...buckbox.webhookIps,
      ...onik.webhookIps,
      ...rocky.webhookIps,
    ];

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
