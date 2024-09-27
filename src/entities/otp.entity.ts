import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { ID_TYPE } from "@/enums";
import { getUlidId } from "@/utils/helperFunctions.utils";

@Entity("auth_otp")
export class AuthOtpEntity {
  @PrimaryColumn()
  id: string;

  @Column({ length: 6 })
  code: string;

  @Column({ unique: true })
  mobile: string;

  @Column({ type: "timestamp" })
  expiredAt: Date;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.OTP);
  }
}
