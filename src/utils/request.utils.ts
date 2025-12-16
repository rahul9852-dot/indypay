import { Request } from "express";

const normalizeIp = (ip: string): string => {
  if (!ip) return ip;

  // Convert IPv6-mapped IPv4 addresses to IPv4 format
  if (ip.startsWith("::ffff:")) {
    return ip.substring(7);
  }

  // Keep ::1 as is for local development
  return ip;
};

export const getCurrentUserIp = (req: Request) => {
  const xForwardedFor = req.headers["x-forwarded-for"];
  if (
    xForwardedFor &&
    Array.isArray(xForwardedFor) &&
    xForwardedFor.length > 0
  ) {
    return normalizeIp(xForwardedFor[0]);
  }
  if (xForwardedFor && typeof xForwardedFor === "string") {
    return normalizeIp(xForwardedFor);
  }

  const ip = req.socket?.remoteAddress || req.ip;

  return normalizeIp(ip);
};
