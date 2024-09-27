import { SetMetadata } from "@nestjs/common";
import { IGNORE_KYC_KEY } from "@/constants/auth.constant";

export const IgnoreKyc = () => SetMetadata(IGNORE_KYC_KEY, true);
