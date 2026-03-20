import { Injectable, BadRequestException } from "@nestjs/common";
import { PGAdapterRegistry } from "./pg-adapter.registry";
import { CircuitBreakerService } from "./circuit-breaker.service";
import { PayinResult } from "./interfaces/pg-payin-adapter.interface";
import { CreatePayinTransactionAnviNeoDto } from "@/modules/payments/dto/create-payin-payment.dto";
import { UsersEntity } from "@/entities/user.entity";
import { CustomLogger } from "@/logger";

/**
 * O-1 + O-4 fix: Smart PG Router with circuit breaker and automatic fallback.
 *
 * ROUTING STRATEGY
 * ─────────────────
 * 1. User's assigned PG is tried first (primary).
 * 2. If the primary circuit is OPEN (too many recent failures), the router
 *    automatically tries every other registered PG in order until one succeeds.
 * 3. If a request to any PG fails at runtime, its failure counter is
 *    incremented. When it hits the threshold the circuit opens and that PG
 *    is skipped on future requests until the recovery timeout elapses.
 * 4. If all PGs are unavailable, a clear error is returned to the merchant.
 *
 * HOW TO ADD A NEW PG
 * ────────────────────
 * 1. Write a class that implements IPGPayinAdapter (see the interface file).
 * 2. In onModuleInit(), call: this.registry.register(this)
 * 3. Add it to the NestJS module providers.
 * 4. Done — this router picks it up automatically. No changes here ever needed.
 */
@Injectable()
export class IntegrationPayinRouterService {
  private readonly logger = new CustomLogger(
    IntegrationPayinRouterService.name,
  );

  constructor(
    private readonly registry: PGAdapterRegistry,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {}

  async routePayin(
    primaryPGCode: string,
    dto: CreatePayinTransactionAnviNeoDto,
    user: UsersEntity,
  ): Promise<PayinResult> {
    const primary = primaryPGCode.toUpperCase();
    const allCodes = this.registry.getAllCodes();

    if (!allCodes.length) {
      throw new BadRequestException(
        "No payment gateway adapters are registered. Please configure an integration.",
      );
    }

    // Build priority list: user's assigned PG first, then all others as fallbacks.
    // This means merchants always get their preferred PG when healthy, and
    // automatically fall over to any other healthy PG when it isn't.
    const priorityList = [primary, ...allCodes.filter((c) => c !== primary)];

    const attempted: string[] = [];

    for (const pgCode of priorityList) {
      const adapter = this.registry.get(pgCode);

      // PG code is in the list but no adapter is registered — skip.
      if (!adapter) {
        this.logger.warn(
          `[ROUTER] PG code ${pgCode} has no registered adapter — skipping.`,
        );
        continue;
      }

      // Circuit is OPEN for this PG — fail fast, try next.
      const available = await this.circuitBreaker.isAvailable(pgCode);
      if (!available) {
        this.logger.warn(
          `[ROUTER] Circuit OPEN for ${pgCode} — skipping, trying next PG.`,
        );
        attempted.push(`${pgCode}(circuit-open)`);
        continue;
      }

      try {
        this.logger.info(
          `[ROUTER] Sending to ${pgCode}${pgCode !== primary ? ` (fallback from ${primary})` : ""} for user ${user.id}`,
        );

        const result = await adapter.createPayin(dto, user);

        // Request succeeded — close the circuit (reset failure counter).
        await this.circuitBreaker.recordSuccess(pgCode);

        if (pgCode !== primary) {
          this.logger.warn(
            `[ROUTER] ⚠️ Served via fallback PG ${pgCode} — primary ${primary} was unavailable.`,
          );
        }

        return result;
      } catch (error: any) {
        // Request failed — increment failure counter, potentially open circuit.
        await this.circuitBreaker.recordFailure(pgCode);
        attempted.push(`${pgCode}(${error.message})`);

        this.logger.error(
          `[ROUTER] ${pgCode} failed: ${error.message} — trying next PG.`,
        );
        // Continue to next PG in fallback chain.
      }
    }

    // All PGs exhausted.
    throw new BadRequestException(
      `All payment gateways are currently unavailable. ` +
        `Attempted: [${attempted.join(", ")}]. Please try again shortly.`,
    );
  }
}
