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

/** All 21 platform permission codes */
export enum UmsPermissionCode {
  ACCOUNT_FREEZE = "account:freeze",
  ANALYTICS_FULL = "analytics:full",
  ANALYTICS_PARTIAL = "analytics:partial",
  API_KEY_MANAGEMENT = "api_key:manage",
  AUDIT_LOGS = "audit:logs",
  CREDIT_PRODUCTS = "credit:products",
  FEATURE_FLAGS = "feature_flags:manage",
  INTERNATIONAL_TRANSFER = "transfer:international",
  KYC_APPROVE = "kyc:approve",
  KYC_VIEW = "kyc:view",
  REFUND_INITIATE = "refund:initiate",
  ROLE_MANAGEMENT = "role:manage",
  SAR_FILING = "sar:file",
  SETTLEMENT_REPORTS = "settlement:reports",
  SYSTEM_CONFIG = "system:config",
  TXN_INITIATE = "txn:initiate",
  TXN_VIEW_ALL = "txn:view:all",
  TXN_VIEW_OWN = "txn:view:own",
  TXN_VOID = "txn:void",
  USER_PII_FULL = "user:pii:full",
  USER_PII_MASKED = "user:pii:masked",
}

@Entity("ums_permissions")
export class UmsPermissionEntity {
  @PrimaryColumn()
  id: string;

  /** Dot-colon notation: 'resource:action' or 'resource:sub:scope' */
  @Index({ unique: true })
  @Column({ length: 100 })
  code: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 100 })
  resource: string;

  @Column({ length: 100 })
  action: string;

  /** 'full' | 'masked' | 'own' | 'all' | 'international' | 'credit' | 'flags' */
  @Column({ length: 50, default: "full" })
  scope: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.UMS_PERMISSION);
  }
}
