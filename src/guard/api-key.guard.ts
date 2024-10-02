import {
  CanActivate,
  ExecutionContext,
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

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(UserApiKeysEntity)
    private readonly apiKeyRepository: Repository<UserApiKeysEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
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

      if (apiKeyEntity.user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
        throw new UnauthorizedException(
          ERROR_MESSAGES.accountStatusMsg(apiKeyEntity.user.accountStatus),
        );
      }

      const decryptedClientSecret = await decryptData(
        apiKeyEntity.clientSecret,
      );

      if (decryptedClientSecret !== clientSecret) {
        throw new UnauthorizedException("Invalid credentials");
      }

      request[REQUEST_USER_KEY] = apiKeyEntity.user;
    } catch (err) {
      err;
    }

    return true;
  }
}
