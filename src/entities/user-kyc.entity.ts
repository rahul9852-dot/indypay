import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UsersEntity } from "./user.entity";
import { ID_TYPE, KYC_STATUS } from "@/enums";
import { getUlidId } from "@/utils/helperFunctions.utils";

@Entity("user_kyc")
export class UserKycEntity {
  @PrimaryColumn()
  id: string;

  @Column({ enum: KYC_STATUS, default: KYC_STATUS.PENDING })
  kycStatus: number;

  @Column({ nullable: true })
  pan: string;

  @Column({ nullable: true })
  aadhar: string;

  // Relations
  @OneToOne(() => UsersEntity, ({ kyc }) => kyc, {
    onDelete: "CASCADE",
  })
  user: UsersEntity;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.USER_KYC);
  }
}
