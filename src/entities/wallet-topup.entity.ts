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
import { ID_TYPE } from "@/enums";
import { getUlidId } from "@/utils/helperFunctions.utils";

@Entity("wallet-topup")
@Index(["userId", "createdAt"])
export class WalletTopupEntity {
  @PrimaryColumn()
  id: string;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    comment: "collection amount",
  })
  collectionAmount: number; // collection amount

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    comment: "payin charge",
  })
  payInCharge: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    comment: "amount after payin deduction",
  })
  amountAfterPayinDeduction: number; // amount after payin deduction

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    comment: "payout charge",
  })
  payOutCharge: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    comment: "amount after charges (payin + payout) deduction",
  })
  topUpAmount: number; // amount after charges (payin + payout) deduction

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => UsersEntity, ({ walletTopup }) => walletTopup, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: UsersEntity;

  @Column({ nullable: true })
  topupById: string;

  @ManyToOne(() => UsersEntity, { nullable: true })
  @JoinColumn({ name: "topupById" })
  topupBy: UsersEntity;

  @Index()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.WALLET_TOPUP);
  }
}
