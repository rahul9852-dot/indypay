import { Request } from "express";

export const getCurrentUserIp = (req: Request) => {
  const xForwardedFor = req.headers["x-forwarded-for"];
  if (
    xForwardedFor &&
    Array.isArray(xForwardedFor) &&
    xForwardedFor.length > 0
  ) {
    return xForwardedFor[0];
  }
  if (xForwardedFor && typeof xForwardedFor === "string") {
    return xForwardedFor;
  }

  return req.socket?.remoteAddress || req.ip;
};
