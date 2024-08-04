import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { getUlidId } from "utils/helperFunctions.utils";
import { OTP_TYPE } from "enums";
import { MerchantsEntity } from "./merchants.entity";

@Entity("otps")
export class OtpEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  mobileOtp: string;

  @Column()
  emailOtp: string;

  @Column({ enum: OTP_TYPE })
  type: number;

  @Column()
  merchantId: string;

  // Relations
  @OneToOne(() => MerchantsEntity, ({ otp }) => otp)
  @JoinColumn()
  merchant: MerchantsEntity;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId("otp");
  }
}
