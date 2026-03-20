import { CookieOptions } from "express";
import { appConfig } from "@/config/app.config";

const { isProduction, allowCookiesDomain } = appConfig();

export const cookieOptions: CookieOptions = {
  httpOnly: isProduction, // accessible only by web server
  secure: isProduction, // true in production, false in development
  sameSite: "lax", // stricter in production
  domain: allowCookiesDomain || undefined, // let browser set domain in development
  path: "/",
};

export const accessCookieOptions: CookieOptions = {
  ...cookieOptions,
  maxAge: 60 * 60 * 1000, // 60 minutes
};

export const refreshCookieOptions: CookieOptions = {
  ...cookieOptions,
  maxAge: 60 * 60 * 1000 * 24 * 7, // 7 days
};

export const mobileVerifyCookieOptions: CookieOptions = {
  ...cookieOptions,
  maxAge: 15 * 60 * 1000, // 15 minutes
};

export const pendingSignUpCookieOptions: CookieOptions = {
  ...cookieOptions,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
};

// S-5 fix: use sameSite: "strict" for the 2FA verify-token cookie so it is never
// sent on any cross-site navigation, preventing an attacker from completing the
// 2FA challenge from a third-party origin.
export const verifyTokenCookieOptions: CookieOptions = {
  ...cookieOptions,
  sameSite: "strict",
  maxAge: 300000, // 5 minutes
};
