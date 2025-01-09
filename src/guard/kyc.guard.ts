import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IGNORE_KYC_KEY, REQUEST_USER_KEY } from "@/constants/auth.constant";
import { ONBOARDING_STATUS, USERS_ROLE } from "@/enums";
import { UsersEntity } from "@/entities/user.entity";
import { MessageResponseDto } from "@/dtos/common.dto";

@Injectable()
export class KycGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ignoreKyc = this.reflector.getAllAndOverride<boolean>(
      IGNORE_KYC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (ignoreKyc) return true;

    const user: UsersEntity = context.switchToHttp().getRequest()[
      REQUEST_USER_KEY
    ];

    if (!user) {
      throw new UnauthorizedException();
    }

    if ([USERS_ROLE.ADMIN, USERS_ROLE.OWNER].includes(user.role)) {
      return true;
    }

    if (user?.onboardingStatus !== ONBOARDING_STATUS.KYC_VERIFIED) {
      throw new ForbiddenException(new MessageResponseDto("KYC is pending"));
    }

    return true;
  }
}
