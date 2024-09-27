import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { Request } from "express";
import { Reflector } from "@nestjs/core";
import { appConfig } from "@/config/app.config";
import { IAccessTokenPayload } from "@/interface/common.interface";
import { PUBLIC_KEY, REQUEST_USER_KEY } from "@/constants/auth.constant";
import { ACCOUNT_STATUS, COOKIE_KEYS } from "@/enums";
import { UsersEntity } from "@/entities/user.entity";
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
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const accessToken = this.extractTokenFromCookie(request);

    if (!accessToken) {
      throw new UnauthorizedException();
    }
    try {
      const payload = (await this.jwtService.verifyAsync(accessToken, {
        secret: accessTokenSecret,
      })) as IAccessTokenPayload;

      const user = await this.usersRepository.findOne({
        where: { id: payload.id },
        relations: ["kyc"],
      });

      if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
        throw new UnauthorizedException(
          ERROR_MESSAGES.accountStatusMsg(user.accountStatus),
        );
      }

      request[REQUEST_USER_KEY] = user;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    return request.cookies?.[COOKIE_KEYS.ACCESS_TOKEN];
  }
}
