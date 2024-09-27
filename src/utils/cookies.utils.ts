import { CookieOptions } from "express";
import { appConfig } from "@/config/app.config";

const { isProduction } = appConfig();

export const cookieOptions: CookieOptions = {
  httpOnly: true, // accessible only by web server
  ...(isProduction && {
    secure: true, // only send cookie over https
    domain: ".paybolt.in",
    sameSite: "none",
  }),
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
