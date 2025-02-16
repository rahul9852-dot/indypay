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
  totalCollections: number; // Total amount collected +500; +200; +1000 ==> 1700; -1200

  @Column({
    type: "numeric",
    precision: 15,
    scale: 2,
    default: 0,
  })
  serviceCharge: number; // Service charge applied on collection +100; +50; +150 ==> 300

  @Column({
    type: "numeric",
    precision: 15,
    scale: 2,
    default: 0,
  })
  collectionAfterDeduction: number; // Collection after deduction +400; +150; +850 ==> 1400; -1000 ==> 400;

  @Column({
    type: "numeric",
    precision: 15,
    scale: 2,
    default: 0,
  })
  availablePayoutBalance: number; // Available balance for payout // +95 ==> 95; -90 ==> 5; -5 ==> 0; +190 ==> 190

  @Column({
    type: "numeric",
    precision: 15,
    scale: 2,
    default: 0,
  })
  totalPayout: number; // Total amount paid out +90; +5; ==> 95
  // (totalTopUp - payoutServiceCharge) == (totalPayout + availablePayoutBalance)

  @Column({
    type: "numeric",
    precision: 15,
    scale: 2,
    default: 0,
  })
  totalTopUp: number; // Total top-up amount +100 ==> 100; +200 ==> 300;

  @Column({
    type: "numeric",
    precision: 15,
    scale: 2,
    default: 0,
  })
  payoutServiceCharge: number; // Service charge for payout 5; 10; ==> 15

  // Relations
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
