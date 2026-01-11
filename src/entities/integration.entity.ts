import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserIntegrationMappingEntity } from "./user-integration-mapping.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";

@Entity("integrations")
@Index(["code", "isActive"])
export class IntegrationEntity {
  @PrimaryColumn()
  id: string;

  @Column({ type: "varchar", length: 100 })
  name: string; // e.g., "Onik Payin", "Fyntra Payin"

  @Index()
  @Column({ type: "varchar", length: 50, unique: true })
  code: string; // e.g., "ONIK", "FYNTRA", "GEOPAY", "UTKARSH"

  @Column({ type: "jsonb", nullable: true })
  config: Record<string, any>; // Integration-specific configuration

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  dailyLimit: number; // Daily limit for this integration

  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  dailyLimitConsumed: number; // Amount consumed today

  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  monthlyLimit: number; // Monthly limit for this integration

  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  monthlyLimitConsumed: number; // Amount consumed this month

  @Column({ type: "date", nullable: true })
  lastResetDate: Date; // Last date when limits were reset

  @OneToMany(
    () => UserIntegrationMappingEntity,
    (mapping) => mapping.integration,
    { cascade: true },
  )
  userMappings: UserIntegrationMappingEntity[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.INTEGRATION);
    if (!this.lastResetDate) {
      this.lastResetDate = new Date();
    }
  }
}
