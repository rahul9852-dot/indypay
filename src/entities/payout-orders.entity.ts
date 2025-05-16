import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
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
@Index(["userId", "createdAt"])
export class PayOutOrdersEntity {
  @PrimaryColumn()
  id: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  amount: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountBeforeDeduction: number;

  @Index()
  @Column({ unique: true })
  orderId: string;

  @Column({ nullable: true })
  batchId: string;

  @Column()
  transferMode: string;

  @Index()
  @Column({ enum: PAYMENT_STATUS, default: PAYMENT_STATUS.PENDING })
  status: string;

  @Column({ nullable: true })
  transferId: string;

  // @Column({ nullable: true })
  // custUniqRef: string;

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

  @Column({ type: "decimal", precision: 10, scale: 2 })
  commissionInPercentage: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  gstInPercentage: number;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => UsersEntity, ({ payOutOrders }) => payOutOrders, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: UsersEntity;

  @OneToOne(() => TransactionsEntity, ({ payOutOrder }) => payOutOrder, {
    onDelete: "CASCADE",
  })
  transaction: TransactionsEntity;

  @Column({ nullable: true, type: "timestamptz" })
  successAt: Date;

  @Column({ nullable: true, type: "timestamptz" })
  failureAt: Date;

  @Index()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.PAYOUT_KEY);
  }
}
