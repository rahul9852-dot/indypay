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
import { CommissionSlabEntity } from "./commission-slab.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";
import { COMMISSION_TYPE } from "@/enums/commission.enum";

@Entity("commissions")
@Index(["type", "isActive"])
export class CommissionEntity {
  @PrimaryColumn()
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({
    type: "enum",
    enum: COMMISSION_TYPE,
  })
  type: COMMISSION_TYPE; // PAYIN or PAYOUT

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 18 })
  defaultGstPercentage: number; // Default GST for this commission plan

  @OneToMany(() => CommissionSlabEntity, (slab) => slab.commission, {
    cascade: true,
  })
  slabs: CommissionSlabEntity[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.COMMISSION);
  }
}
