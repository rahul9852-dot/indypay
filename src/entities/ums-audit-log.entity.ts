import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from "typeorm";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";

export enum UmsAuditStatus {
  BLOCKED = "BLOCKED",
  FAILURE = "FAILURE",
  SUCCESS = "SUCCESS",
}

/**
 * Append-only audit trail — NEVER update or delete rows from this table.
 * Compliant with RBI 7-year data-retention mandate.
 * Every privilege-elevated action, auth event, or config change lands here.
 */
@Entity("ums_audit_logs")
export class UmsAuditLogEntity {
  @PrimaryColumn()
  id: string;

  /** The user who performed the action (null for system-initiated events) */
  @Index()
  @Column({ nullable: true })
  actorId: string | null;

  /** Denormalised role code at the time of the action — avoids join on hot read path */
  @Column({ length: 50, nullable: true })
  actorRole: string | null;

  /** Tenant context; null = platform-level action */
  @Index()
  @Column({ nullable: true })
  tenantId: string | null;

  /** Verb: 'user.role.assign', 'kyc.approve', 'session.revoke', 'config.update', etc. */
  @Index()
  @Column({ length: 100 })
  action: string;

  /** Resource type: 'user', 'role', 'tenant', 'permission', 'session', etc. */
  @Column({ length: 100 })
  resource: string;

  /** Primary key of the affected resource */
  @Index()
  @Column({ nullable: true })
  resourceId: string | null;

  /**
   * Full context payload: before/after diffs, request body excerpts, enrichment.
   * Stored as JSONB for flexible querying without schema changes.
   */
  @Column({ type: "jsonb", default: {} })
  details: Record<string, unknown>;

  /** IPv4 or IPv6 of the request origin */
  @Column({ length: 45, nullable: true })
  ipAddress: string | null;

  /** Stable hash of browser/device fingerprint for anomaly detection */
  @Column({ length: 255, nullable: true })
  deviceFingerprint: string | null;

  @Column({ type: "text", nullable: true })
  userAgent: string | null;

  /** SUCCESS | FAILURE | BLOCKED */
  @Column({ length: 20, default: UmsAuditStatus.SUCCESS })
  status: UmsAuditStatus;

  /** Immutable creation timestamp — no updatedAt on an append-only table */
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.UMS_AUDIT_LOG);
  }
}
