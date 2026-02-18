import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UsersEntity } from "./user.entity";
import { TransactionsEntity } from "./transaction.entity";
import { PAYMENT_STATUS, SETTLEMENT_STATUS } from "@/enums/payment.enum";
import { PAYMENT_METHOD } from "@/enums/payment-method.enum";

@Entity("payin_orders")
// @Index(["userId", "createdAt"])
export class PayInOrdersEntity {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  amount: number;

  @Index()
  @Column({ unique: true })
  orderId: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  mobile: string;

  // @Index()
  @Column({ enum: PAYMENT_STATUS, default: PAYMENT_STATUS.PENDING })
  status: string;

  @Column({ nullable: true })
  txnRefId: string;

  @Column({ enum: PAYMENT_METHOD, default: PAYMENT_METHOD.UPI })
  paymentMethod: string;

  @Column({ nullable: true })
  intent: string;

  @Column({ nullable: true })
  paymentLink: string;

  @Column({ nullable: true })
  utr: string;

  @Column({ default: false })
  isMisspelled: boolean;

  // Legacy fields (kept for backward compatibility)
  @Column({ type: "decimal", precision: 10, scale: 2, default: 4.5 })
  commissionInPercentage: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  commissionAmount: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 18 })
  gstInPercentage: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  gstAmount: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  netPayableAmount: number;

  // New dynamic commission fields
  @Column({ nullable: true })
  commissionId: string; // ID of the commission plan used

  @Column({ nullable: true })
  commissionSlabId: string; // ID of the commission slab applied

  @Column({ type: "varchar", length: 50, nullable: true })
  chargeType: string; // PERCENTAGE or FLAT

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  chargeValue: number; // The percentage or flat value used

  @Column({ enum: SETTLEMENT_STATUS, default: SETTLEMENT_STATUS.NOT_INITIATED })
  settlementStatus: string;

  @Column({ nullable: true })
  userVpa: string;

  // @Index()
  @Column()
  userId: string;

  @ManyToOne(() => UsersEntity, ({ payInOrders }) => payInOrders, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: UsersEntity;

  @OneToOne(() => TransactionsEntity, ({ payInOrder }) => payInOrder, {
    onDelete: "CASCADE",
  })
  transaction: TransactionsEntity;

  @Column({ nullable: true, type: "timestamptz" })
  successAt: Date;

  @Column({ nullable: true, type: "timestamptz" })
  failureAt: Date;

  @Column({ nullable: true, type: "jsonb" })
  checkoutData: any;

  // @Index()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  // @BeforeInsert()
  // beforeInsertHook() {
  //   this.id = getUlidId(ID_TYPE.PAYIN_KEY);
  // }
}
