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
import { appConfig } from "@/config/app.config";

const {
  transactionConfig: { commissionInPercentage, gstInPercentage },
} = appConfig();

@Entity("payin_orders")
export class PayInOrdersEntity {
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

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ enum: PAYMENT_STATUS, default: PAYMENT_STATUS.PENDING })
  status: string;

  @Column({ nullable: true })
  txnRefId: string;

  @Column({ nullable: true })
  paymentUrl: string;

  @Column({ type: "numeric", precision: 10, scale: 2, default: 4.5 })
  commissionInPercentage: number;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  commissionAmount: number;

  @Column({ type: "numeric", precision: 10, scale: 2, default: 18 })
  gstInPercentage: number;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  gstAmount: number;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  netPayableAmount: number;

  // Relations
  @ManyToOne(() => UsersEntity, ({ payInOrders }) => payInOrders, {
    onDelete: "CASCADE",
  })
  user: UsersEntity;

  @OneToOne(() => TransactionsEntity, ({ payInOrder }) => payInOrder, {
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
    this.id = getUlidId(ID_TYPE.PAYIN_KEY);
    this.commissionInPercentage = commissionInPercentage;
    this.gstInPercentage = gstInPercentage;
    this.commissionAmount = (this.amount * this.commissionInPercentage) / 100;
    this.gstAmount = (this.commissionAmount * this.gstInPercentage) / 100;
    this.netPayableAmount =
      this.amount - (this.commissionAmount + this.gstAmount);
  }
}
