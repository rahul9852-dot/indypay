import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { UsersEntity } from "./user.entity";
import { UserMediaKycEntity } from "./user-media-kyc.entity";
import { ID_TYPE, KYC_STATUS } from "@/enums";
import { getUlidId } from "@/utils/helperFunctions.utils";

@Entity("user_kyc")
export class UserKycEntity {
  @PrimaryColumn()
  id: string;

  @Column({ enum: KYC_STATUS, default: KYC_STATUS.PENDING })
  kycStatus: number;

  @Column({ nullable: true })
  panId: string;

  @Column({ nullable: true })
  aadharId: string;

  @Column({ nullable: true })
  addressProofId: string;

  @Column({ nullable: true })
  bankStatementId: string;

  // Relations
  @OneToOne(() => UsersEntity, (user) => user.kyc)
  @JoinColumn()
  user: UsersEntity;

  @OneToMany(() => UserMediaKycEntity, (mediaKyc) => mediaKyc.userKyc)
  mediaKyc: UserMediaKycEntity[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = `kyc_${getUlidId(ID_TYPE.USER_KYC)}`;
  }
}
