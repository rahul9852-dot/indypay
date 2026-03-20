import { Injectable } from "@nestjs/common";
import { IPGPayinAdapter } from "./interfaces/pg-payin-adapter.interface";
import { CustomLogger } from "@/logger";

/**
 * O-4 fix: Central registry for all PG payin adapters.
 *
 * Each adapter self-registers by calling `registry.register(this)` inside
 * its `onModuleInit()`. The router reads from this registry at request time —
 * no switch statements, no hardcoded PG lists anywhere.
 *
 * Adding a new PG = write adapter + add to module providers.
 * The registry and router need zero changes.
 */
@Injectable()
export class PGAdapterRegistry {
  private readonly logger = new CustomLogger(PGAdapterRegistry.name);
  private readonly adapters = new Map<string, IPGPayinAdapter>();

  /**
   * Called by each adapter in its onModuleInit().
   * Overwrites any existing adapter with the same code (safe for hot reload).
   */
  register(adapter: IPGPayinAdapter): void {
    const code = adapter.code.toUpperCase();
    this.adapters.set(code, adapter);
    this.logger.info(`[REGISTRY] ✅ PG adapter registered: ${code}`);
  }

  /**
   * Returns the adapter for a given PG code, or undefined if not registered.
   */
  get(code: string): IPGPayinAdapter | undefined {
    return this.adapters.get(code.toUpperCase());
  }

  /**
   * Returns all registered PG codes in registration order.
   * Used by the router to build the fallback chain.
   */
  getAllCodes(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Returns true if at least one adapter is registered.
   * Useful for health checks.
   */
  hasAdapters(): boolean {
    return this.adapters.size > 0;
  }
}
