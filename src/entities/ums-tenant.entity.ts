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

export enum UmsTenantType {
  AGGREGATOR = "AGGREGATOR",
  PARTNER = "PARTNER",
  RESELLER = "RESELLER"
}

export enum UmsTenantStatus {
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
  SUSPENDED = "SUSPENDED",
  TERMINATED = "TERMINATED",
}

export enum UmsKybStatus {
  PENDING = "PENDING",
  REJECTED = "REJECTED",
  SUBMITTED = "SUBMITTED",
  VERIFIED = "VERIFIED"
}

/**
 * Registry of all external business tenants (Partners / Resellers / Aggregators).
 * Each tenant gets an isolated role-permission namespace scoped via tenantId.
 */
@Entity("ums_tenants")
export class UmsTenantEntity {
  @PrimaryColumn()
  id: string;

  /** Unique short code for the tenant e.g. 'HDFC_PARTNER' */
  @Index({ unique: true })
  @Column({ length: 80 })
  code: string;

  @Column({ length: 200 })
  name: string;

  /** PARTNER | RESELLER | AGGREGATOR */
  @Column({ length: 20 })
  type: UmsTenantType;

  /** The user who owns / registered this tenant */
  @Index()
  @Column()
  ownerId: string;

  /** For hierarchical tenants: a Reseller's parent is a Partner */
  @Index()
  @Column({ nullable: true })
  parentTenantId: string | null;

  /**
   * Flexible JSONB config bag: webhook URLs, logo, branding, feature toggles, etc.
   * Avoids premature schema migrations for tenant-specific settings.
   */
  @Column({ type: "jsonb", default: {} })
  config: Record<string, unknown>;

  @Column({ length: 20, default: UmsTenantStatus.PENDING })
  status: UmsTenantStatus;

  /** Know-Your-Business verification status */
  @Column({ length: 20, default: UmsKybStatus.PENDING })
  kybStatus: UmsKybStatus;

  /** API rate-limit override (requests/min); null = use global default */
  @Column({ nullable: true })
  apiRateLimit: number | null;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.UMS_TENANT);
  }
}
