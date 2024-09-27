import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { REQUEST_USER_KEY, ROLES_KEY } from "@/constants/auth.constant";
import { USERS_ROLE } from "@/enums";
import { UsersEntity } from "@/entities/user.entity";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<USERS_ROLE[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const user: UsersEntity = context.switchToHttp().getRequest()[
      REQUEST_USER_KEY
    ];

    return requiredRoles.some((role) => user?.role === role);
  }
}
