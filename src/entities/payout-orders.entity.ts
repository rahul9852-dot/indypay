import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UsersEntity } from "./user.entity";
import { TransactionsEntity } from "./transaction.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";
import { CURRENCY_ENUM, PAYMENT_STATUS } from "@/enums/payment.enum";

@Entity("payout_orders")
export class PayOutOrdersEntity {
  @PrimaryColumn()
  id: string;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
  })
  amount: number;

  @Column({ enum: CURRENCY_ENUM, default: CURRENCY_ENUM.INR })
  currency: string;

  @Column({ enum: PAYMENT_STATUS, default: PAYMENT_STATUS.PENDING })
  status: string;

  @Column({ nullable: true })
  externalPaymentId: string;

  @Column({ nullable: true })
  paymentUrl: string;

  // Relations
  @ManyToOne(() => UsersEntity, ({ payOutOrders }) => payOutOrders, {
    onDelete: "CASCADE",
  })
  user: UsersEntity;

  @OneToOne(() => TransactionsEntity, ({ payOutOrder }) => payOutOrder, {
    onDelete: "CASCADE",
  })
  transaction: TransactionsEntity;

  @Column({ nullable: true, type: "timestamp" })
  successAt: Date;

  @Column({ nullable: true, type: "timestamp" })
  failureAt: Date;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.PAYOUT_KEY);
  }
}
