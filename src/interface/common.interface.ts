import { ONBOARDING_STATUS } from "enums";

export interface IAccessTokenPayload {
  id: string;
  email: string;
}

export type IRefreshTokenPayload = IAccessTokenPayload;

export interface IPendingSignUpPayload {
  id: string;
  email: string;
  onboardingStatus: ONBOARDING_STATUS;
}
