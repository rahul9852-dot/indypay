import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
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
import { ACCOUNT_STATUS, COOKIE_KEYS, ONBOARDING_STATUS } from "@/enums";
import { UsersEntity } from "@/entities/user.entity";
import { REDIS_KEYS } from "@/constants/redis-cache.constant";
import { MessageResponseDto } from "@/dtos/common.dto";
import { ERROR_MESSAGES } from "@/constants/messages.constant";

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

      let user = (await this.cacheManager.get(
        REDIS_KEYS.USER_KEY(payload.id),
      )) as UsersEntity | undefined;

      if (!user) {
        user = await this.usersRepository.findOne({
          where: { id: payload.id },
        });
        await this.cacheManager.set(
          REDIS_KEYS.USER_KEY(payload.id),
          user,
          1000 * 60 * 60 * 24,
        ); // 24 hr
      }

      if (
        !(
          user.accountStatus === ACCOUNT_STATUS.ACTIVE ||
          user.accountStatus === ACCOUNT_STATUS.INACTIVE
        )
      ) {
        throw new ForbiddenException(
          ERROR_MESSAGES.accountStatusMsg(user.accountStatus),
        );
      }

      if (user.onboardingStatus < ONBOARDING_STATUS.KYC_VERIFIED) {
        throw new ForbiddenException(
          new MessageResponseDto("Please verify your KYC first"),
        );
      }

      request[REQUEST_USER_KEY] = user;
    } catch (err) {
      throw err;
    }

    return true;
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    return request.cookies?.[COOKIE_KEYS.ACCESS_TOKEN];
  }
}
