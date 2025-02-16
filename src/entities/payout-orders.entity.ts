import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UsersEntity } from "./user.entity";
import { TransactionsEntity } from "./transaction.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";
import { PAYMENT_STATUS } from "@/enums/payment.enum";

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

  @Index()
  @Column({ unique: true })
  orderId: string;

  @Column({ nullable: true })
  batchId: string;

  @Column()
  transferMode: string;

  @Column({ enum: PAYMENT_STATUS, default: PAYMENT_STATUS.PENDING })
  status: string;

  @Column({ nullable: true })
  transferId: string;

  @Column({ nullable: true })
  utr: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  bankAccountNumber: string;

  @Column({ nullable: true })
  bankIfsc: string;

  @Column({ nullable: true, default: "DEFAULT" })
  purpose: string;

  @Column({ nullable: true, default: "DEFAULT" })
  remarks: string;

  @Index()
  @Column({ nullable: true, unique: true })
  payoutId: string;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  commissionInPercentage: number;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  commissionAmount: number;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  gstInPercentage: number;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  gstAmount: number;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  netPayableAmount: number;

  // Relations
  @ManyToOne(() => UsersEntity, ({ payOutOrders }) => payOutOrders, {
    onDelete: "CASCADE",
  })
  user: UsersEntity;

  @OneToOne(() => TransactionsEntity, ({ payOutOrder }) => payOutOrder, {
    onDelete: "CASCADE",
  })
  transaction: TransactionsEntity;

  @Column({ nullable: true, type: "timestamptz" })
  successAt: Date;

  @Column({ nullable: true, type: "timestamptz" })
  failureAt: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.PAYOUT_KEY);
  }
}
