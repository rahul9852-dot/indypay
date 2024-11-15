import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UsersEntity } from "./user.entity";
import { ID_TYPE } from "@/enums";
import { getUlidId } from "@/utils/helperFunctions.utils";

@Entity("wallets")
export class WalletEntity {
  @PrimaryColumn()
  id: string;

  @Column({
    type: "numeric",
    precision: 15,
    scale: 2,
    default: 0,
  })
  totalCollections: number; // Total amount collected

  @Column({
    type: "numeric",
    precision: 15,
    scale: 2,
    default: 0,
  })
  settledAmount: number; // Total amount settled

  @Column({
    type: "numeric",
    precision: 15,
    scale: 2,
    default: 0,
  })
  unsettledAmount: number; // Total amount unsettled

  @Column({
    type: "numeric",
    precision: 15,
    scale: 2,
    default: 0,
  })
  commissionAmount: number;

  @Column({
    type: "numeric",
    precision: 15,
    scale: 2,
    default: 0,
  })
  gstAmount: number;

  @Column({
    type: "numeric",
    precision: 15,
    scale: 2,
    default: 0,
  })
  netPayableAmount: number;

  // Relations
  @OneToOne(() => UsersEntity, ({ wallet }) => wallet, {
    onDelete: "CASCADE",
  })
  user: UsersEntity;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.WALLET);
  }
}
