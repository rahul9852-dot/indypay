import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

/**
 * A-9 fix: Correlation / Trace IDs.
 *
 * PROBLEM THIS SOLVES
 * ───────────────────
 * Without a shared trace ID, debugging a single failed payment requires
 * manually correlating timestamps across PM2 instance logs, Bull processor
 * logs, and DB query logs — almost impossible under load.
 *
 * HOW IT WORKS
 * ─────────────
 * 1. Every inbound request is assigned a UUID v4 trace ID.
 *    If the caller already set X-Request-ID (e.g. merchant's backend, API
 *    gateway, or load balancer), we reuse it so the ID is consistent
 *    end-to-end across the entire call chain.
 * 2. The trace ID is attached to the Express request object as `req.traceId`
 *    so controllers and services can include it in log lines.
 * 3. The ID is echoed back in the X-Request-ID response header so merchants
 *    can include it in support tickets for instant log lookup.
 *
 * USAGE IN SERVICES / PROCESSORS
 * ─────────────────────────────────
 * Any NestJS controller/service that receives the Express Request can read:
 *   (req as any).traceId   →  "550e8400-e29b-41d4-a716-446655440000"
 * For Bull processors that run outside the HTTP context, the orderId already
 * acts as the correlation key — include it in every log line.
 */
@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Reuse caller-supplied ID if present (e.g. from API gateway or merchant).
    // Fall back to a fresh UUID so every request always has a trace ID.
    const traceId =
      (req.headers["x-request-id"] as string | undefined) || randomUUID();

    (req as any).traceId = traceId;

    // Echo back so the caller can correlate their own logs with ours.
    res.setHeader("X-Request-ID", traceId);

    next();
  }
}
