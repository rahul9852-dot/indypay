import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from "@nestjs/common";
import { IVerifyMobilePayload } from "@/interface/common.interface";
import {
  IGNORE_MOBILE_VERIFICATION_KEY,
  MOBILE_INFO_KEY,
} from "@/constants/auth.constant";

export const Mobile = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): IVerifyMobilePayload => {
    const request = ctx.switchToHttp().getRequest();

    return request[MOBILE_INFO_KEY];
  },
);

export const IgnoreMobileVerification = () =>
  SetMetadata(IGNORE_MOBILE_VERIFICATION_KEY, true);
