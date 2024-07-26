import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { Request } from "express";

export const Cookies = createParamDecorator(
  (cookieName: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();

    return request.cookies?.[cookieName];
  },
);
