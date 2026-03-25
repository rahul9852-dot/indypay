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

/**
 * JWT session registry + blacklist.
 * Every issued JWT's JTI is recorded here.
 * On token verification: if row is absent OR isActive=false → reject.
 * This enables instant revocation without waiting for token expiry.
 */
@Entity("ums_sessions")
export class UmsSessionEntity {
  @PrimaryColumn()
  id: string;

  @Index()
  @Column()
  userId: string;

  /**
   * JWT ID claim (jti) — unique per token.
   * Use this to blacklist a specific token without invalidating all user sessions.
   */
  @Index({ unique: true })
  @Column({ length: 255 })
  jti: string;

  /** Stable hash of browser/device environment for anomaly detection */
  @Column({ length: 255, nullable: true })
  deviceFingerprint: string | null;

  @Column({ length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: "text", nullable: true })
  userAgent: string | null;

  /** false = blacklisted / logged-out */
  @Column({ default: true })
  isActive: boolean;

  /** Set when the session is explicitly revoked */
  @Column({ type: "timestamptz", nullable: true })
  revokedAt: Date | null;

  /** 'logout' | 'admin_revoke' | 'suspicious_activity' | 'password_change' | 'expired' */
  @Column({ length: 100, nullable: true })
  revokedReason: string | null;

  /** When this JWT naturally expires — used for cleanup jobs */
  @Column({ type: "timestamptz" })
  expiresAt: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.UMS_SESSION);
  }
}
