import { STATUS } from "enums";
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { getUlidId } from "utils/helperFunctions.utils";
import { BusinessDetailsEntity } from "./business-details.entity";

@Entity("merchants")
export class MerchantsEntity {
  @PrimaryColumn()
  id: string;

  @Column({ comment: "merchant name as per pan card" })
  fullName: string;

  @Index({ unique: true })
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  mobile: string;

  @Column({ default: false, comment: "it will verify by OTP" })
  isMobileVerified: boolean;

  @Column({ default: false, comment: "it will verify by OTP" })
  isEmailVerified: boolean;

  @Column({ default: false })
  isKycVerified: boolean;

  @Column({ enum: STATUS, default: STATUS.ACTIVE })
  status: number;

  @Column({ default: false })
  isWhatsAppAlertsEnabled: boolean;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  pincode?: string;

  @Column({ nullable: true })
  aadhar?: string;

  @Column({ nullable: true })
  pan?: string;

  @Column({ nullable: true })
  image?: string;

  @OneToOne(() => BusinessDetailsEntity, ({ merchant }) => merchant)
  businessDetails: BusinessDetailsEntity;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId("mer");
  }
}
