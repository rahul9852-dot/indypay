import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { IAccessTokenPayload } from "interface/common.interface";

export const User = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): IAccessTokenPayload => {
    const request = ctx.switchToHttp().getRequest();

    return request.user as IAccessTokenPayload;
  },
);
