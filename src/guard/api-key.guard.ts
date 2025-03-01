import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { UserApiKeysEntity } from "@/entities/user-api-key.entity";
import { REQUEST_USER_KEY } from "@/constants/auth.constant";
import { ACCOUNT_STATUS } from "@/enums";
import { ERROR_MESSAGES } from "@/constants/messages.constant";
import { decryptData } from "@/utils/encode-decode.utils";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";
import { UserWhitelistIpsEntity } from "@/entities/user-whitelist-ip.entity";
import { REDIS_KEYS } from "@/constants/redis-cache.constant";
import { getCurrentUserIp } from "@/utils/request.utils";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new CustomLogger(ApiKeyGuard.name);
  constructor(
    @InjectRepository(UserApiKeysEntity)
    private readonly apiKeyRepository: Repository<UserApiKeysEntity>,
    @InjectRepository(UserWhitelistIpsEntity)
    private readonly userWhitelistIpsRepository: Repository<UserWhitelistIpsEntity>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const requestIp = getCurrentUserIp(request);

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
      let apiKeyEntity: UserApiKeysEntity = await this.cacheManager.get(
        REDIS_KEYS.API_KEY(clientId),
      );

      if (!apiKeyEntity) {
        apiKeyEntity = await this.apiKeyRepository.findOne({
          where: { clientId },
          relations: {
            user: true,
          },
        });

        if (!apiKeyEntity) {
          throw new UnauthorizedException("Invalid credentials");
        }

        await this.cacheManager.set(
          REDIS_KEYS.API_KEY(clientId),
          apiKeyEntity,
          1000 * 60 * 60 * 24 * 30,
        ); // 30 day

        if (apiKeyEntity.user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
          throw new ForbiddenException(
            ERROR_MESSAGES.accountStatusMsg(apiKeyEntity.user.accountStatus),
          );
        }

        // if (
        //   apiKeyEntity.user.onboardingStatus < ONBOARDING_STATUS.KYC_VERIFIED
        // ) {
        //   throw new ForbiddenException(
        //     new MessageResponseDto("Please verify your KYC first"),
        //   );
        // }
      }
      this.logger.info(
        `API KEY Request IP: ${requestIp} - ${apiKeyEntity.user.fullName} - [${request.method}] - ${request.url}}`,
      );

      request.method === "POST" &&
        this.logger.info(
          `API KEY Request Body: ${LoggerPlaceHolder.Json}`,
          request.body,
        );

      const userId = apiKeyEntity.user.id;

      const userWhitelistIps = await this.userWhitelistIpsRepository.find({
        where: { user: { id: userId } },
      });

      // this.logger.info(
      //   `user whitelist ips: ${LoggerPlaceHolder.Json}`,
      //   userWhitelistIps.map((ip) => ip.ipAddress),
      // );

      const isIpWhitelisted = userWhitelistIps.some(
        (whitelistIp) => whitelistIp.ipAddress === requestIp,
      );

      if (!isIpWhitelisted) {
        throw new ForbiddenException(`Invalid IP address`);
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
}
