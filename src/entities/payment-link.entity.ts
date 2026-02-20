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
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";
import { PAYMENT_STATUS } from "@/enums/payment.enum";

@Entity("payment_links")
@Index(["userId", "createdAt"])
export class PaymentLinkEntity {
  @PrimaryColumn()
  id: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column()
  email: string;

  @Column({ type: "text", nullable: true })
  name: string;

  @Column()
  mobile: string;

  @Index()
  @Column({ enum: PAYMENT_STATUS, default: PAYMENT_STATUS.PENDING })
  status: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => UsersEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: UsersEntity;

  @Column({ type: "text" })
  encryptedData: string;

  @Column({ type: "timestamptz", nullable: true })
  expiresAt: Date;

  @Column({ type: "boolean", default: false })
  notifyOnEmail: boolean;

  @Column({ type: "boolean", default: false })
  notifyOnNumber: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.PAYIN_KEY);
  }
}
