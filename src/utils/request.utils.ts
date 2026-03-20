import { Request } from "express";

const normalizeIp = (ip: string): string => {
  if (!ip) return ip;
  // Convert IPv6-mapped IPv4 addresses to plain IPv4
  if (ip.startsWith("::ffff:")) {
    return ip.substring(7);
  }

  return ip;
};

/**
 * Returns the verified client IP address.
 *
 * Relies on Express's built-in trust-proxy resolution — `app.set("trust proxy", 1)`
 * is configured in main.ts. With that setting, Express reads X-Forwarded-For from
 * right to left, strips the trusted proxy hops, and exposes the real client IP via
 * `req.ip`. Manual parsing of the raw XFF header is intentionally avoided: reading
 * the leftmost value lets an attacker prepend any IP and bypass allowlists (S-3).
 */
export const getCurrentUserIp = (req: Request): string => {
  return normalizeIp(req.ip || req.socket?.remoteAddress || "");
};
