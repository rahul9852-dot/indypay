import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { Request } from "express";
import { appConfig } from "@/config/app.config";
import { IAccessTokenPayload } from "@/interface/common.interface";
import { REQUEST_USER_KEY } from "@/constants/auth.constant";
import { COOKIE_KEYS } from "@/enums";
import { UsersEntity } from "@/entities/user.entity";

const {
  jwtConfig: { accessTokenSecret },
} = appConfig();

@Injectable()
export class ChangeRoleGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
        where: { id: request.body.userId || "" },
      });

      if (!user) {
        throw new NotFoundException("User not found");
      }

      const newRole = request.body.role;
      const requesterRole = payload.role;
      const userRole = user.role;

      if (requesterRole <= userRole || requesterRole <= newRole) {
        throw new ForbiddenException("You don't have permission");
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
