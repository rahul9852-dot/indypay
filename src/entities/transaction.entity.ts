import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { PayInOrdersEntity } from "./payin-orders.entity";
import { PayOutOrdersEntity } from "./payout-orders.entity";
import { UsersEntity } from "./user.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";
import { PAYMENT_TYPE } from "@/enums/payment.enum";

@Entity("transactions")
@Index(["userId", "createdAt"])
export class TransactionsEntity {
  @PrimaryColumn()
  id: string;

  @Index()
  @Column({ enum: PAYMENT_TYPE })
  transactionType: string;

  @Column({ nullable: true })
  payInOrderId: number;

  @JoinColumn({ name: "payInOrderId" })
  @OneToOne(() => PayInOrdersEntity, ({ transaction }) => transaction, {
    onDelete: "CASCADE",
  })
  payInOrder: PayInOrdersEntity;

  @Column({ nullable: true })
  payOutOrderId: string;

  @JoinColumn({ name: "payOutOrderId" })
  @OneToOne(() => PayOutOrdersEntity, ({ transaction }) => transaction, {
    onDelete: "CASCADE",
  })
  payOutOrder: PayOutOrdersEntity;

  @Index()
  @Column()
  userId: string;

  // D-9 fix: RESTRICT prevents accidental user deletion from wiping financial records.
  @ManyToOne(() => UsersEntity, ({ transactions }) => transactions, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "userId" })
  user: UsersEntity;

  @Column({ nullable: true, type: "timestamptz" })
  failureAt: Date;

  @Column({ nullable: true, type: "timestamptz" })
  successAt: Date;

  @Index()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  // D-9 fix: soft delete — financial records are never hard-deleted.
  @DeleteDateColumn({ type: "timestamptz", nullable: true })
  deletedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.TRANSACTIONS_KEY);
  }
}
