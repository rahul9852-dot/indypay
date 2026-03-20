import { Injectable } from "@nestjs/common";
import { CustomLogger } from "@/logger";

/**
 * Cache Monitoring Service
 *
 * A-1 fix: the previous implementation stored hit/miss counters in a Node.js
 * in-memory Map. With 6 PM2 cluster instances each process had its own
 * independent copy — aggregate metrics were impossible to compute and the Maps
 * just grew unboundedly (up to MAX_EVENTS=1000 objects per instance) without
 * ever being read by any endpoint or scheduler.
 *
 * Fix: remove all in-memory state. Per-request debug logs still work correctly
 * because Winston writes to the same log sink regardless of PM2 instance.
 * If aggregate hit-rate metrics are needed in the future, they should be stored
 * in Redis using INCR / HINCRBY so all instances share a single counter.
 */
@Injectable()
export class CacheMonitorService {
  private readonly logger = new CustomLogger(CacheMonitorService.name);

  recordHit(cacheKey: string, ttl?: number): void {
    this.logger.debug(
      `[CACHE HIT] Key: ${cacheKey} | TTL: ${ttl ? `${ttl}ms` : "N/A"}`,
    );
  }

  recordMiss(cacheKey: string): void {
    this.logger.debug(`[CACHE MISS] Key: ${cacheKey}`);
  }

  recordSet(cacheKey: string, ttl: number): void {
    this.logger.debug(`[CACHE SET] Key: ${cacheKey} | TTL: ${ttl}ms`);
  }
}
