import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UsersEntity } from "./user.entity";
import { TransactionsEntity } from "./transaction.entity";
import { PayInOrdersEntity } from "./payin-orders.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";
import { PAYMENT_STATUS } from "@/enums/payment.enum";

@Entity("payout_batches")
export class PayoutBatchesEntity {
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
  transferMode: string;

  @Column({ enum: PAYMENT_STATUS, default: PAYMENT_STATUS.PENDING })
  status: string;

  @Column({ nullable: true })
  transferId: string;

  // Relations
  @ManyToOne(() => UsersEntity, ({ payOutOrders }) => payOutOrders, {
    onDelete: "CASCADE",
  })
  user: UsersEntity;

  @OneToMany(() => PayInOrdersEntity, ({ payoutBatch }) => payoutBatch, {
    cascade: true,
  })
  payInOrders: PayInOrdersEntity;

  @OneToOne(() => TransactionsEntity, ({ payoutBatch }) => payoutBatch, {
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
    this.id = getUlidId(ID_TYPE.PAYOUT_BATCH_KEY);
  }
}
