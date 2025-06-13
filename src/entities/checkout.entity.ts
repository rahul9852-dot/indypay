import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  PrimaryColumn,
} from "typeorm";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";

@Entity("checkouts")
export class CheckoutEntity {
  @PrimaryColumn()
  id: string;

  @Column({ type: "text", nullable: true })
  payerName: string;

  @Column({ type: "text" })
  payerEmail: string;

  @Column({ type: "text", nullable: true })
  payerMobile: string;

  @Column({ type: "text", nullable: true })
  payerAddress: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  amount: string;

  @Column({ type: "text", unique: true })
  clientTxnId: string;

  @Index()
  @Column({ enum: PAYMENT_STATUS, default: PAYMENT_STATUS.PENDING })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.CHECKOUT);
  }
}
