import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { ulid } from "ulid";
import { Cache } from "cache-manager";
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { VerifyTokenDto } from "./dto/sso.dto";
import { appConfig } from "@/config/app.config";
import { REDIS_KEYS } from "@/constants/redis-cache.constant";
import { decryptData, encryptData } from "@/utils/encode-decode.utils";
import { UsersEntity } from "@/entities/user.entity";
import { UsersService } from "@/modules/users/users.service";

const {
  sso: { invoice },
} = appConfig();

@Injectable()
export class SsoService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly usersService: UsersService,
  ) {}

  async generateUrl(user: UsersEntity) {
    const token = await this.generateTokenAndStoreInRedis(user);

    return { url: `${invoice.baseUrl}/sso/verify?token=${token}` };
  }

  async verifyToken(verifyTokenDto: VerifyTokenDto) {
    if (
      !this.verifyCredentials({
        clientId: verifyTokenDto.clientId,
        clientSecret: verifyTokenDto.clientSecret,
      })
    ) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const token = await decryptData(verifyTokenDto.token);

    if (!token) {
      throw new UnauthorizedException("Invalid token");
    }

    const userId = this.extractUserId(token);

    const cachedToken = await this.cacheManager.get(
      REDIS_KEYS.SSO_TOKEN(userId),
    );

    if (cachedToken !== token) {
      throw new UnauthorizedException("Invalid token");
    }

    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    await this.cacheManager.del(REDIS_KEYS.SSO_TOKEN(token));

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        accountStatus: user.accountStatus,
        role: user.role,
      },
    };
  }

  verifyCredentials({
    clientId,
    clientSecret,
  }: {
    clientId: string;
    clientSecret: string;
  }) {
    if (
      invoice.clientId === clientId &&
      invoice.clientSecret === clientSecret
    ) {
      return true;
    }

    return false;
  }

  async generateTokenAndStoreInRedis(user: UsersEntity) {
    const token = this.generateToken(user.id);

    await this.cacheManager.set(
      REDIS_KEYS.SSO_TOKEN(user.id),
      token,
      1000 * 60 * 60,
    ); // 1 hr

    // encrypt token
    const tokenEncrypted = await encryptData(token);

    return tokenEncrypted;
  }

  generateToken(userId: string) {
    return `${userId}_${ulid()}`;
  }

  extractUserId(token: string) {
    const [_, timeStamp] = token.split("_");

    return `usr_${timeStamp}`;
  }
}
