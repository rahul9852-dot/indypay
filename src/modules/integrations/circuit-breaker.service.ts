import { Injectable, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { CustomLogger } from "@/logger";

/**
 * Circuit breaker states:
 *
 *   CLOSED     — PG is healthy. Requests flow normally.
 *
 *   OPEN       — PG has failed too many times. Requests are rejected
 *                immediately (fail fast). After RECOVERY_TIMEOUT the
 *                state key expires in Redis → transitions to HALF_OPEN.
 *
 *   HALF_OPEN  — Recovery window. The next request is used as a probe:
 *                if it succeeds → CLOSED, if it fails → OPEN again.
 *
 * All state is stored in Redis so every PM2 instance shares the same
 * circuit state. One instance detecting a failing PG immediately
 * protects all other instances.
 */

// How many consecutive failures trip the circuit to OPEN.
const FAILURE_THRESHOLD = 5;

// How long the circuit stays OPEN before auto-transitioning to HALF_OPEN (ms).
// Redis TTL on the state key drives this — when the key expires, the state
// is treated as HALF_OPEN.
const RECOVERY_TIMEOUT_MS = 60_000; // 1 minute

// How long failure counters live in Redis (reset automatically each window).
const FAILURE_COUNTER_TTL_MS = 120_000; // 2 minutes

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new CustomLogger(CircuitBreakerService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * Call after every successful PG request.
   * Resets the failure counter and closes the circuit.
   */
  async recordSuccess(pgCode: string): Promise<void> {
    const code = pgCode.toUpperCase();
    await Promise.all([
      this.cacheManager.del(`cb:failures:${code}`),
      this.cacheManager.set(
        `cb:state:${code}`,
        "CLOSED",
        FAILURE_COUNTER_TTL_MS,
      ),
    ]);
  }

  /**
   * Call after every failed PG request.
   * Increments the failure counter and opens the circuit if threshold is hit.
   */
  async recordFailure(pgCode: string): Promise<void> {
    const code = pgCode.toUpperCase();
    const failureKey = `cb:failures:${code}`;
    const stateKey = `cb:state:${code}`;

    const current = (await this.cacheManager.get<number>(failureKey)) ?? 0;
    const updated = current + 1;

    await this.cacheManager.set(failureKey, updated, FAILURE_COUNTER_TTL_MS);

    if (updated >= FAILURE_THRESHOLD) {
      // Trip the circuit OPEN. Redis TTL acts as the recovery timer —
      // when the key expires the circuit automatically becomes HALF_OPEN.
      await this.cacheManager.set(stateKey, "OPEN", RECOVERY_TIMEOUT_MS);

      this.logger.error(
        `[CIRCUIT BREAKER] ⚡ Circuit OPENED for PG: ${code} ` +
          `after ${updated} consecutive failures. ` +
          `Will auto-recover in ${RECOVERY_TIMEOUT_MS / 1000}s.`,
      );
    }
  }

  /**
   * Returns the current circuit state for a PG.
   * When the Redis key doesn't exist (expired) → HALF_OPEN (probe mode).
   */
  async getState(pgCode: string): Promise<"CLOSED" | "OPEN" | "HALF_OPEN"> {
    const state = await this.cacheManager.get<string>(
      `cb:state:${pgCode.toUpperCase()}`,
    );

    if (!state) return "HALF_OPEN"; // key expired = recovery window elapsed

    return state as "CLOSED" | "OPEN" | "HALF_OPEN";
  }

  /**
   * Returns true if the PG can accept requests right now.
   * OPEN → false (fail fast, try fallback).
   * CLOSED / HALF_OPEN → true (allow through; HALF_OPEN acts as a probe).
   */
  async isAvailable(pgCode: string): Promise<boolean> {
    const state = await this.getState(pgCode);

    return state !== "OPEN";
  }
}
