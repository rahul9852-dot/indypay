import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { BusinessDetailsEntity } from "./business-details.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import {
  ONBOARDING_STATUS,
  ACCOUNT_STATUS,
  USERS_ROLE,
  ID_TYPE,
} from "@/enums";

@Entity("users")
export class UsersEntity {
  @PrimaryColumn()
  id: string;

  @Column({ comment: "merchant name as per pan card" })
  fullName: string;

  @Index({ unique: true })
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, select: false })
  password: string;

  @Index({ unique: true })
  @Column({ unique: true })
  mobile: string;

  @Column({
    default: false,
    comment: "kyc will verify on verify.paybolt.in with aadhar & pan",
  })
  isKycVerified: boolean;

  @Column({ default: false, comment: "2FA" })
  is2FAEnabled: boolean;

  @Column({ nullable: true, comment: "2FA secret" })
  secret2FA: string;

  @Column({ enum: ACCOUNT_STATUS, default: ACCOUNT_STATUS.ACTIVE })
  status: number;

  @Column({ enum: USERS_ROLE, default: USERS_ROLE.MERCHANT })
  role: number;

  @Column({ enum: ONBOARDING_STATUS, default: ONBOARDING_STATUS.SIGN_UP })
  onboardingStatus: number;

  @Column()
  businessDetailsId: string;

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

  // Relations
  @OneToOne(() => BusinessDetailsEntity, ({ user }) => user, { cascade: true })
  @JoinColumn({ name: "businessDetailsId" })
  businessDetails: BusinessDetailsEntity;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.USER);
  }
}
