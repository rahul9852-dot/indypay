import { CookieOptions } from "express";
import { appConfig } from "@/config/app.config";

const { isProduction } = appConfig();

export const cookieOptions: CookieOptions = {
  httpOnly: true, // accessible only by web server
  secure: isProduction, // only send cookie over https
};

export const accessCookieOptions: CookieOptions = {
  ...cookieOptions,
  maxAge: 5 * 60 * 1000, // 5 minutes
};

export const refreshCookieOptions: CookieOptions = {
  ...cookieOptions,
  maxAge: 60 * 60 * 1000, // 60 minutes
};

export const pendingSignUpCookieOptions: CookieOptions = {
  ...cookieOptions,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
};
