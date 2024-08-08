import { appConfig } from "@/config/app.config";

const { beBaseUrl } = appConfig();

export const OAUTH_GOOGLE_REDIRECT_URL = `${beBaseUrl}/api/v1/auth/google/callback`;

export const OAUTH_MICROSOFT_REDIRECT_URL = `${beBaseUrl}/api/v1/auth/microsoft/callback`;

export const OTPLESS_REDIRECT_URI = `${beBaseUrl}/api/v1/auth/otpless/callback`;
