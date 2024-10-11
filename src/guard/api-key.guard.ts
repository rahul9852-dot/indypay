import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserApiKeysEntity } from "@/entities/user-api-key.entity";
import { REQUEST_USER_KEY } from "@/constants/auth.constant";
import { ACCOUNT_STATUS } from "@/enums";
import { ERROR_MESSAGES } from "@/constants/messages.constant";
import { decryptData } from "@/utils/encode-decode.utils";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";
import { UserWhitelistIpsEntity } from "@/entities/user-whitelist-ip.entity";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new CustomLogger(ApiKeyGuard.name);
  constructor(
    @InjectRepository(UserApiKeysEntity)
    private readonly apiKeyRepository: Repository<UserApiKeysEntity>,
    @InjectRepository(UserWhitelistIpsEntity)
    private readonly userWhitelistIpsRepository: Repository<UserWhitelistIpsEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const requestIp = this.parseIp(request);

    this.logger.info(`api key request ip: ${requestIp}`);

    const [type, cred] = request.headers?.authorization?.split(" ") || [];
    if (type !== "Basic" || !cred) {
      throw new UnauthorizedException();
    }

    const [clientId, clientSecret] =
      Buffer.from(cred, "base64").toString().split(":") || [];

    if (!clientId || !clientSecret) {
      throw new UnauthorizedException();
    }

    try {
      const apiKeyEntity = await this.apiKeyRepository.findOne({
        where: { clientId },
        relations: {
          user: true,
        },
      });

      if (!apiKeyEntity) {
        throw new UnauthorizedException("Invalid credentials");
      }

      if (apiKeyEntity.user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
        throw new UnauthorizedException(
          ERROR_MESSAGES.accountStatusMsg(apiKeyEntity.user.accountStatus),
        );
      }

      const userId = apiKeyEntity.user.id;

      const userWhitelistIps = await this.userWhitelistIpsRepository.find({
        where: { user: { id: userId } },
      });

      this.logger.info(
        `user whitelist ips: ${LoggerPlaceHolder.Json}`,
        userWhitelistIps,
      );

      const isIpWhitelisted = userWhitelistIps.some(
        (whitelistIp) => whitelistIp.ipAddress === requestIp,
      );

      if (!isIpWhitelisted) {
        throw new ForbiddenException("Invalid IP address");
      }

      const decryptedClientSecret = await decryptData(
        apiKeyEntity.clientSecret,
      );

      if (decryptedClientSecret !== clientSecret) {
        throw new UnauthorizedException("Invalid credentials");
      }

      request[REQUEST_USER_KEY] = apiKeyEntity.user;
    } catch (err) {
      throw err;
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
