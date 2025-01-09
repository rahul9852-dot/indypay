import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  BeforeInsert,
} from "typeorm";
import { UserKycEntity } from "./user-kyc.entity";
import { ID_TYPE, KYC_STATUS } from "@/enums";
import { getUlidId } from "@/utils/helperFunctions.utils";

@Entity("media_kyc")
export class MediaKycEntity {
  @PrimaryColumn()
  id: string;

  @Column({ enum: KYC_STATUS, default: KYC_STATUS.PENDING })
  kycStatus: number;

  @Column({ nullable: true })
  fileName: string;

  @Column({ nullable: true })
  fileType: string;

  @Column({ nullable: true })
  url: string;

  @Column({ nullable: true })
  documentType: string;

  // Relations
  @ManyToOne(() => UserKycEntity, ({ media }) => media, {
    onDelete: "CASCADE",
  })
  userKyc: UserKycEntity;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.MEDIA_KYC);
  }
}
