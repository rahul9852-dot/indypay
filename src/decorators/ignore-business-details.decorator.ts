import { SetMetadata } from "@nestjs/common";
import { IGNORE_BUSINESS_DETAILS_KEY } from "@/constants/auth.constant";

export const IgnoreBusinessDetails = () =>
  SetMetadata(IGNORE_BUSINESS_DETAILS_KEY, true);
