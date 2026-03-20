import { CreatePayinTransactionAnviNeoDto } from "@/modules/payments/dto/create-payin-payment.dto";
import { UsersEntity } from "@/entities/user.entity";

/**
 * Standard result shape every PG adapter must return from createPayin().
 * The router passes this directly back to the merchant — keep it stable.
 */
export interface PayinResult {
  orderId: string;
  intent: string; // UPI intent URI or payment link URL
  message: string;
}

/**
 * O-1 + O-4 fix: The contract every Payment Gateway adapter must implement.
 *
 * HOW TO ADD A NEW PG (zero router changes needed):
 *  1. Create a new service class that implements this interface
 *  2. Set `readonly code` to the PG's unique identifier (e.g., "ONIK")
 *  3. In `onModuleInit()`, call `this.registry.register(this)`
 *  4. Add the service to its NestJS module providers
 *  5. Done — the router picks it up automatically on next startup
 *
 * The router NEVER needs to be modified when adding new PGs.
 */
export interface IPGPayinAdapter {
  /**
   * Unique uppercase identifier matching IntegrationEntity.code in DB.
   * Examples: "ONIK", "GEOPAY", "FYNTRA", "UTKARSH", "KDS"
   */
  readonly code: string;

  /**
   * Initiate a payin with this PG. Must throw on failure so the router
   * can trigger the circuit breaker and try the next adapter.
   */
  createPayin(
    dto: CreatePayinTransactionAnviNeoDto,
    user: UsersEntity,
  ): Promise<PayinResult>;
}
