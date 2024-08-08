import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { DESIGNATION, ID_TYPE } from "@/enums";

@Entity("onboarding_users")
export class OnboardingUsersEntity {
  @PrimaryColumn()
  id: string;

  @Column({ comment: "merchant name as per pan card" })
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Index({ unique: true })
  @Column({ unique: true })
  mobile: string;

  @Column()
  businessName: string;

  @Column({ enum: DESIGNATION })
  designation: DESIGNATION;

  @Column({ nullable: true })
  otplessId: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.ONBOARDING_USER);
  }
}
