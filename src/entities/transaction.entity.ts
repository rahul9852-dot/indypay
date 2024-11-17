import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
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
export class TransactionsEntity {
  @PrimaryColumn()
  id: string;

  @Column({ enum: PAYMENT_TYPE })
  transactionType: string;

  // Relations
  @JoinColumn()
  @OneToOne(() => PayInOrdersEntity, ({ transaction }) => transaction, {
    onDelete: "CASCADE",
  })
  payInOrder: PayInOrdersEntity;

  @JoinColumn()
  @OneToOne(() => PayOutOrdersEntity, ({ transaction }) => transaction, {
    onDelete: "CASCADE",
  })
  payOutOrder: PayOutOrdersEntity;

  @ManyToOne(() => UsersEntity, ({ transactions }) => transactions, {
    onDelete: "CASCADE",
  })
  user: UsersEntity;

  @Column({ nullable: true, type: "timestamptz" })
  failureAt: Date;

  @Column({ nullable: true, type: "timestamptz" })
  successAt: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.TRANSACTIONS_KEY);
  }
}
