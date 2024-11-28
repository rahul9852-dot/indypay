import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UsersEntity } from "./user.entity";
import { UserBankDetailsEntity } from "./user-bank-details.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";
import { PAYMENT_STATUS, PAYOUT_PAYMENT_MODE } from "@/enums/payment.enum";

@Entity("settlements")
export class SettlementsEntity {
  @PrimaryColumn()
  id: string;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
  })
  amount: number;

  @Column({ enum: PAYOUT_PAYMENT_MODE, default: PAYOUT_PAYMENT_MODE.IMPS })
  transferMode: string;

  @Column({ enum: PAYMENT_STATUS, default: PAYMENT_STATUS.PENDING })
  status: string;

  @Column({ nullable: true })
  transferId: string;

  @Column({ nullable: true })
  remarks: string;

  // Relations
  @ManyToOne(() => UsersEntity, ({ settlements }) => settlements, {
    onDelete: "CASCADE",
  })
  user: UsersEntity;

  @ManyToOne(() => UserBankDetailsEntity, ({ settlements }) => settlements, {
    onDelete: "CASCADE",
  })
  bankDetails: UserBankDetailsEntity;

  @ManyToOne(() => UsersEntity, { nullable: true })
  settledBy: UsersEntity;

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
    this.id = getUlidId(ID_TYPE.SETTLEMENT_PAYOUT);
  }
}
