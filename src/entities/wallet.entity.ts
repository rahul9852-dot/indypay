import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
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
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  totalCollections: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  serviceCharge: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  collectionAfterDeduction: number;

  @Index()
  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  availablePayoutBalance: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  totalPayout: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  totalTopUp: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  payoutServiceCharge: number;

  @OneToOne(() => UsersEntity, ({ wallet }) => wallet, {
    onDelete: "CASCADE",
  })
  user: UsersEntity;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.WALLET);
  }
}
