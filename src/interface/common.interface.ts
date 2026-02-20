import { ONBOARDING_STATUS, USERS_ROLE } from "@/enums";

export interface IAccessTokenPayload {
  id: string;
  onboardingStatus: ONBOARDING_STATUS;
  role: USERS_ROLE;
  email: string;
  mobile: string;
}

export type IRefreshTokenPayload = IAccessTokenPayload;

export interface IVerifyMobilePayload {
  mobile?: string;
  email?: string;
  isVerified: boolean;
}

export interface IGeneratePaymentLinkPayload {
  amount: number;
  orderId: string;
  vpa: string;
}
