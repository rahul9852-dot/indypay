import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UsersEntity } from "./user.entity";
import { UserBankDetailsEntity } from "./user-bank-details.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE, SETTLEMENT_TYPE } from "@/enums";
import { PAYMENT_STATUS, PAYOUT_PAYMENT_MODE } from "@/enums/payment.enum";

@Entity("settlements")
@Index(["userId", "createdAt"])
export class SettlementsEntity {
  @PrimaryColumn()
  id: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
  })
  collectionAmount: number;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    default: 0,
  })
  serviceCharge: number;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountAfterDeduction: number;

  @Column({ enum: SETTLEMENT_TYPE, default: SETTLEMENT_TYPE.MANUAL })
  settlementType: string;

  @Index()
  @Column({ enum: PAYOUT_PAYMENT_MODE, default: PAYOUT_PAYMENT_MODE.IMPS })
  transferMode: string;

  @Index()
  @Column({ enum: PAYMENT_STATUS, default: PAYMENT_STATUS.PENDING })
  status: string;

  @Column({ nullable: true })
  transferId: string;

  @Column({ nullable: true })
  remarks: string;

  @Column({ nullable: true })
  utr: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => UsersEntity, ({ settlements }) => settlements, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: UsersEntity;

  @Column({ nullable: true })
  bankDetailsId: string;

  @ManyToOne(() => UserBankDetailsEntity, ({ settlements }) => settlements, {
    onDelete: "CASCADE",
    nullable: true,
  })
  @JoinColumn({ name: "bankDetailsId" })
  bankDetails: UserBankDetailsEntity;

  @Column({ nullable: true })
  settledById: string;

  @ManyToOne(() => UsersEntity, { nullable: true })
  @JoinColumn({ name: "settledById" })
  settledBy: UsersEntity;

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
    this.id = getUlidId(ID_TYPE.SETTLEMENT_PAYOUT);
  }
}
