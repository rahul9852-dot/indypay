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
import { UmsPermissionEntity } from "./ums-permission.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";

/**
 * Y = FULL, P = PARTIAL, A = WITH_APPROVAL
 * Directly maps the permission matrix from the UMS spec (Section 5).
 */
export enum UmsGrantType {
  FULL = "FULL",
  PARTIAL = "PARTIAL",
  WITH_APPROVAL = "WITH_APPROVAL",
}

@Entity("ums_role_permissions")
@Index(["roleId", "permissionCode"], { unique: true })
export class UmsRolePermissionEntity {
  @PrimaryColumn()
  id: string;

  @Index()
  @Column()
  roleId: string;

  /** Redundant code column enables fast permission lookups without a join */
  @Index()
  @Column({ length: 100 })
  permissionCode: string;

  @Column({ default: UmsGrantType.FULL })
  grantType: UmsGrantType;

  @ManyToOne(() => UmsRoleEntity, { onDelete: "CASCADE" })
  role: UmsRoleEntity;

  @ManyToOne(() => UmsPermissionEntity, { onDelete: "CASCADE" })
  permission: UmsPermissionEntity;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.UMS_ROLE_PERMISSION);
  }
}
