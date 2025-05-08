import { SetMetadata } from "@nestjs/common";

export const THIRD_PARTY_AUTH_KEY = "third_party_auth";
export const ThirdPartyAuth = (apiName: string) =>
  SetMetadata(THIRD_PARTY_AUTH_KEY, apiName);
