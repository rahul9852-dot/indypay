import { CookieOptions } from "express";

export const cookieOptions: CookieOptions = {
  httpOnly: true, // accessible only by web server
  secure: true, // only send cookie over https
};

export const accessCookieOptions: CookieOptions = {
  ...cookieOptions,
  expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
};

export const refreshCookieOptions: CookieOptions = {
  ...cookieOptions,
  expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
};
