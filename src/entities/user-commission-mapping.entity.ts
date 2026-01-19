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
import { UsersEntity } from "./user.entity";
import { CommissionEntity } from "./commission.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";

@Entity("user_commission_mappings")
@Index(["userId"])
export class UserCommissionMappingEntity {
  @PrimaryColumn()
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column()
  payinCommissionId: string; // Commission plan for payin

  @Column({ nullable: true })
  payoutCommissionId: string | null; // Commission plan for payout (optional, can use same as payin)

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @ManyToOne(() => UsersEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: UsersEntity;

  @ManyToOne(() => CommissionEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "payinCommissionId" })
  payinCommission: CommissionEntity;

  @ManyToOne(() => CommissionEntity, { onDelete: "RESTRICT", nullable: true })
  @JoinColumn({ name: "payoutCommissionId" })
  payoutCommission: CommissionEntity | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.USER_COMMISSION_MAPPING);
  }
}
