import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { CommissionEntity } from "./commission.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";
import { CHARGE_TYPE } from "@/enums/commission.enum";

@Entity("commission_slabs")
@Index(["commissionId", "priority"])
export class CommissionSlabEntity {
  @PrimaryColumn()
  id: string;

  @Index()
  @Column()
  commissionId: string;

  @Column({ type: "decimal", precision: 18, scale: 2, default: 0 })
  minAmount: number; // Minimum amount for this slab (inclusive)

  @Column({
    type: "decimal",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  maxAmount: number | null; // Maximum amount for this slab (exclusive), null = unlimited

  @Column({
    type: "enum",
    enum: CHARGE_TYPE,
  })
  chargeType: CHARGE_TYPE; // PERCENTAGE or FLAT

  @Column({ type: "decimal", precision: 18, scale: 2 })
  chargeValue: number; // Percentage (e.g., 4.5) or Flat amount (e.g., 5.00)

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  gstPercentage: number | null; // GST percentage for this slab (null = use commission default)

  @Column({ type: "int", default: 0 })
  priority: number; // Higher priority = checked first (for overlapping ranges)

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @ManyToOne(() => CommissionEntity, (commission) => commission.slabs, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "commissionId" })
  commission: CommissionEntity;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.COMMISSION_SLAB);
  }
}
