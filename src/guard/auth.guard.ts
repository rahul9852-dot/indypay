import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { Request } from "express";
import { Reflector } from "@nestjs/core";
import { appConfig } from "@/config/app.config";
import { IAccessTokenPayload } from "@/interface/common.interface";
import { PUBLIC_KEY, REQUEST_USER_KEY } from "@/constants/auth.constant";
import { COOKIE_KEYS } from "@/enums";
import { UsersEntity } from "@/entities/user.entity";
import { REDIS_KEYS } from "@/constants/redis-cache.constant";

const {
  jwtConfig: { accessTokenSecret },
} = appConfig();

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const accessToken = this.extractTokenFromCookie(request);

    if (!accessToken) {
      throw new UnauthorizedException();
    }
    try {
      const payload = (await this.jwtService.verifyAsync(accessToken, {
        secret: accessTokenSecret,
      })) as IAccessTokenPayload;

      let user = await this.cacheManager.get(REDIS_KEYS.USER_KEY(payload.id));

      if (!user) {
        user = await this.usersRepository.findOne({
          where: { id: payload.id },
          relations: ["kyc"],
        });
        await this.cacheManager.set(
          REDIS_KEYS.USER_KEY(payload.id),
          user,
          1000 * 60 * 60 * 24,
        ); // 24 hr
      }

      // if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
      //   throw new UnauthorizedException(
      //     ERROR_MESSAGES.accountStatusMsg(user.accountStatus),
      //   );
      // }

      request[REQUEST_USER_KEY] = user;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      } else {
        throw new UnauthorizedException();
      }
    }

    return true;
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    return request.cookies?.[COOKIE_KEYS.ACCESS_TOKEN];
  }
}
