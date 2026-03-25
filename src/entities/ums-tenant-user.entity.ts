import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { UmsTenantEntity } from "./ums-tenant.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";

/**
 * Maps a platform user into a tenant sub-space.
 * A user can belong to multiple tenants (e.g. a consultant working for 2 merchants).
 * The actual role inside that tenant is tracked in ums_user_roles via tenantId.
 */
@Entity("ums_tenant_users")
@Index(["tenantId", "userId"], { unique: true })
export class UmsTenantUserEntity {
  @PrimaryColumn()
  id: string;

  @Index()
  @Column()
  tenantId: string;

  @Index()
  @Column()
  userId: string;

  /** Human-readable label for the member's function within this tenant */
  @Column({ length: 100, nullable: true })
  designation: string | null;

  /** Whether this member is the primary admin contact for the tenant */
  @Column({ default: false })
  isPrimaryContact: boolean;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => UmsTenantEntity, { onDelete: "CASCADE" })
  tenant: UmsTenantEntity;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.UMS_TENANT_USER);
  }
}
