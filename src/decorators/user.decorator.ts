import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { UsersEntity } from "@/entities/user.entity";

export const User = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UsersEntity => {
    const request = ctx.switchToHttp().getRequest();

    return request.user;
  },
);
