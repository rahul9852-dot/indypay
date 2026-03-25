import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";

export enum UmsRoleTier {
  CONSUMER = "C",
  EXTERNAL = "B",
  INTERNAL = "A",
}

export enum UmsRiskLevel {
  CRITICAL = "CRITICAL",
  HIGH = "HIGH",
  LOW = "LOW",
  MEDIUM = "MEDIUM",
}

/** All 17 system role codes (14 from spec + 3 KYC-tier variants) */
export enum UmsRoleCode {
  AGENT = "B5_AGENT",
  AGGREGATOR = "B4_AGGREGATOR",
  BUSINESS_ACCOUNT = "C5_BUSINESS_ACCOUNT",
  COMPLIANCE_OFFICER = "L2_COMPLIANCE_OFFICER",
  CUSTOMER_SUPPORT = "L4_CUSTOMER_SUPPORT",
  DATA_ANALYST = "L4_DATA_ANALYST",
  DEVELOPER = "L3_DEVELOPER",
  FINANCE_OPS = "L3_FINANCE_OPS",
  // Tier C - End Users
  GUEST = "C1_GUEST",
  KYC_TIER1 = "C2_KYC_TIER1",
  KYC_TIER2 = "C3_KYC_TIER2",
  KYC_TIER3 = "C4_KYC_TIER3",
  MERCHANT = "B3_MERCHANT",
  // Tier B - External Business
  PARTNER = "B1_PARTNER",
  RESELLER = "B2_RESELLER",
  RISK_ANALYST = "L2_RISK_ANALYST",
  // Tier A - Internal Operations
  SUPER_ADMIN = "L1_SUPER_ADMIN",
}

@Entity("ums_roles")
export class UmsRoleEntity {
  @PrimaryColumn()
  id: string;

  /** Unique code from the role taxonomy e.g. 'L1_SUPER_ADMIN' */
  @Index({ unique: true })
  @Column({ length: 50 })
  code: string;

  @Column({ length: 100 })
  name: string;

  /** 'A' = Internal, 'B' = External Business, 'C' = Consumer */
  @Column({ length: 1 })
  tier: string;

  /** Hierarchy level: 'L1', 'L2', 'B3', 'C4', etc. */
  @Column({ length: 10 })
  level: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  /** CRITICAL | HIGH | MEDIUM | LOW */
  @Column({ length: 20 })
  riskLevel: string;

  /** System roles are seeded at init and cannot be deleted via API */
  @Column({ default: true })
  isSystemRole: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.UMS_ROLE);
  }
}
