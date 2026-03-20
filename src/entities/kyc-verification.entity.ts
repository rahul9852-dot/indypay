import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from "typeorm";
import { ID_TYPE } from "@/enums";
import { getUlidId } from "@/utils/helperFunctions.utils";

/**
 * Immutable audit row written on every KYC verification attempt.
 * Records are never updated — only appended — so the full history is
 * preserved for RBI compliance and dispute resolution.
 */
@Entity("kyc_verifications")
export class KycVerificationEntity {
  @PrimaryColumn()
  id: string;

  @Index()
  @Column()
  userId: string;

  /** "PAN" | "AADHAAR" | "BANK" — extensible as new checks are added. */
  @Column({ length: 20 })
  verificationType: string;

  /** The masked/plain input value (e.g. PAN number). */
  @Column({ length: 100 })
  input: string;

  /** Provider name for this attempt (e.g. "karza"). */
  @Column({ length: 50 })
  provider: string;

  /** Unique request ID returned by the provider — useful for support queries. */
  @Column({ nullable: true, length: 100 })
  providerRequestId: string | null;

  /** Raw numeric status code from the provider (e.g. Karza's 101/102/105). */
  @Column({ nullable: true })
  providerStatusCode: number | null;

  /** true if the provider confirmed the document is valid. */
  @Column({ default: false })
  verified: boolean;

  /** Full provider response stored as JSONB for audit / future parsing. */
  @Column({ type: "jsonb", nullable: true })
  responseData: Record<string, any> | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = getUlidId(ID_TYPE.KYC_VERIFICATION);
  }
}
