import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { UmsRoleEntity } from "./ums-role.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";

/**
 * Many-to-many bridge between users and UMS roles.
 * One user can hold multiple roles, optionally scoped to a specific tenant.
 * e.g. a user can be MERCHANT in tenant_A and RESELLER in tenant_B simultaneously.
 */
@Entity("ums_user_roles")
@Index(["userId", "roleId", "tenantId"], { unique: true })
export class UmsUserRoleEntity {
  @PrimaryColumn()
  id: string;

  @Index()
  @Column()
  userId: string;

  @Index()
  @Column()
  roleId: string;

  /** null = platform-wide scope; non-null = scoped to a specific tenant */
  @Index()
  @Column({ nullable: true })
  tenantId: string | null;

  /** Who assigned this role — full audit trail */
  @Column({ nullable: true })
  assignedById: string | null;

  /** Optional expiry for temporary elevated access (e.g. incident response) */
  @Column({ type: "timestamptz", nullable: true })
  expiresAt: Date | null;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => UmsRoleEntity, { onDelete: "CASCADE" })
  role: UmsRoleEntity;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.UMS_USER_ROLE);
  }
}
