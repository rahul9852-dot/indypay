import { Injectable, Logger } from "@nestjs/common";

interface CacheMetrics {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRatio: number;
}

interface CacheEvent {
  key: string;
  timestamp: Date;
  ttl?: number;
  hit: boolean;
}

/**
 * Cache Monitoring Service
 *
 * Tracks cache performance metrics including:
 * - Hit/Miss ratios
 * - Cache key usage patterns
 * - Performance analytics
 */
@Injectable()
export class CacheMonitorService {
  private readonly logger = new Logger(CacheMonitorService.name);
  private metrics: Map<string, CacheMetrics> = new Map();
  private recentEvents: CacheEvent[] = [];
  private readonly MAX_EVENTS = 1000; // Keep last 1000 events for analysis

  /**
   * Record a cache hit
   */
  recordHit(cacheKey: string, ttl?: number): void {
    this.updateMetrics(cacheKey, true);
    this.addEvent({ key: cacheKey, timestamp: new Date(), ttl, hit: true });

    this.logger.debug(
      `[CACHE HIT] Key: ${cacheKey} | TTL: ${ttl ? `${ttl}ms` : "N/A"}`,
    );
  }

  /**
   * Record a cache miss
   */
  recordMiss(cacheKey: string): void {
    this.updateMetrics(cacheKey, false);
    this.addEvent({ key: cacheKey, timestamp: new Date(), hit: false });

    this.logger.debug(`[CACHE MISS] Key: ${cacheKey}`);
  }

  /**
   * Record cache set operation
   */
  recordSet(cacheKey: string, ttl: number): void {
    this.logger.debug(
      `[CACHE SET] Key: ${cacheKey} | TTL: ${ttl}ms (${this.formatTTL(ttl)})`,
    );
  }

  /**
   * Get metrics for a specific cache key pattern
   */
  getMetrics(keyPattern?: string): CacheMetrics {
    if (!keyPattern) {
      // Return overall metrics
      return this.calculateOverallMetrics();
    }

    // Return metrics for specific pattern
    const metrics = this.metrics.get(keyPattern);

    return (
      metrics || {
        hits: 0,
        misses: 0,
        totalRequests: 0,
        hitRatio: 0,
      }
    );
  }

  /**
   * Get all metrics by cache key pattern
   */
  getAllMetrics(): Map<string, CacheMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Log current cache statistics
   */
  logStatistics(): void {
    const overall = this.calculateOverallMetrics();

    this.logger.log("=".repeat(60));
    this.logger.log("📊 CACHE STATISTICS");
    this.logger.log("=".repeat(60));
    this.logger.log(`Total Requests: ${overall.totalRequests}`);
    this.logger.log(`Cache Hits: ${overall.hits}`);
    this.logger.log(`Cache Misses: ${overall.misses}`);
    this.logger.log(
      `Hit Ratio: ${(overall.hitRatio * 100).toFixed(2)}% ${this.getHitRatioEmoji(overall.hitRatio)}`,
    );
    this.logger.log("=".repeat(60));

    // Log per-pattern metrics
    if (this.metrics.size > 0) {
      this.logger.log("\n📈 METRICS BY CACHE KEY:");
      this.metrics.forEach((metric, pattern) => {
        this.logger.log(
          `  ${pattern}: ${metric.hits}/${metric.totalRequests} hits (${(metric.hitRatio * 100).toFixed(1)}%)`,
        );
      });
      this.logger.log("=".repeat(60));
    }
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.metrics.clear();
    this.recentEvents = [];
    this.logger.log("Cache metrics reset");
  }

  // Private helper methods

  private updateMetrics(cacheKey: string, isHit: boolean): void {
    const pattern = this.extractPattern(cacheKey);
    const current = this.metrics.get(pattern) || {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      hitRatio: 0,
    };

    if (isHit) {
      current.hits++;
    } else {
      current.misses++;
    }

    current.totalRequests = current.hits + current.misses;
    current.hitRatio =
      current.totalRequests > 0 ? current.hits / current.totalRequests : 0;

    this.metrics.set(pattern, current);
  }

  private extractPattern(cacheKey: string): string {
    // Extract pattern from cache key
    // Example: "stats:merchant:123:2024-01-01:2024-01-31" -> "stats:merchant"
    const parts = cacheKey.split(":");

    return parts.slice(0, 2).join(":");
  }

  private addEvent(event: CacheEvent): void {
    this.recentEvents.push(event);

    // Keep only last MAX_EVENTS events
    if (this.recentEvents.length > this.MAX_EVENTS) {
      this.recentEvents.shift();
    }
  }

  private calculateOverallMetrics(): CacheMetrics {
    let totalHits = 0;
    let totalMisses = 0;

    this.metrics.forEach((metric) => {
      totalHits += metric.hits;
      totalMisses += metric.misses;
    });

    const totalRequests = totalHits + totalMisses;
    const hitRatio = totalRequests > 0 ? totalHits / totalRequests : 0;

    return {
      hits: totalHits,
      misses: totalMisses,
      totalRequests,
      hitRatio,
    };
  }

  private formatTTL(ttl: number): string {
    const minutes = Math.floor(ttl / (60 * 1000));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;

    return `${minutes}m`;
  }

  private getHitRatioEmoji(ratio: number): string {
    if (ratio >= 0.8) return "🟢"; // Excellent
    if (ratio >= 0.6) return "🟡"; // Good
    if (ratio >= 0.4) return "🟠"; // Fair

    return "🔴"; // Poor
  }
}
