import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

/**
 * O-7 fix: Every status transition on a payin order is recorded here.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Previously the system only did UPDATE payin_orders SET status = 'SUCCESS'.
 * The old status was gone forever. This table answers:
 *   - Who changed the status? (triggeredBy)
 *   - When exactly? (createdAt)
 *   - What PG sent the webhook? (pgCode)
 *   - What was the previous status? (previousStatus)
 *
 * This enables: dispute investigation, audit reports, regulatory compliance,
 * replaying history, and feeding downstream analytics.
 *
 * Every row is write-once — never update, never delete.
 */
export enum PayinEventTrigger {
  // PG webhook triggered the change
  ADMIN = "ADMIN", 
  // Admin manually updated via dashboard
  SYSTEM = "SYSTEM", 
  WEBHOOK = "WEBHOOK" // Internal cron / reconciliation job
}

@Entity("payin_event_log")
@Index(["orderId", "createdAt"])
export class PayinEventLogEntity {
  @PrimaryGeneratedColumn("increment")
  id: number;

  // The payin_orders.orderId this event belongs to.
  // Not a FK so event log rows survive even if the order is soft-deleted.
  @Index()
  @Column()
  orderId: string;

  // Status before this change. NULL on the very first status set.
  @Column({ nullable: true })
  previousStatus: string;

  @Column()
  newStatus: string;

  @Column({ enum: PayinEventTrigger, default: PayinEventTrigger.WEBHOOK })
  triggeredBy: string;

  // Which PG sent the webhook that caused this transition.
  // NULL for ADMIN / SYSTEM events.
  @Column({ nullable: true })
  pgCode: string;

  // Raw webhook payload or admin action metadata for full traceability.
  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;
}
