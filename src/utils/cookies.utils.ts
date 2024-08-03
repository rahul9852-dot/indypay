import { CookieOptions } from "express";
import { appConfig } from "config/app.config";

const { isProduction } = appConfig();

export const cookieOptions: CookieOptions = {
  httpOnly: true, // accessible only by web server
  secure: isProduction, // only send cookie over https
};

export const refreshCookieOptions: CookieOptions = {
  ...cookieOptions,
  maxAge: 5 * 60 * 1000, // 5 minutes
};

export const accessCookieOptions: CookieOptions = {
  ...cookieOptions,
  maxAge: 1 * 60 * 1000, // 1 minutes
};
