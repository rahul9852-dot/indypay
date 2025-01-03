import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from "typeorm";
import { UsersEntity } from "./user.entity";
import { UserKycEntity } from "./user-kyc.entity";
import { KYC_STATUS, ID_TYPE } from "@/enums";
import { getUlidId } from "@/utils/helperFunctions.utils";

@Entity("user_media_kyc")
export class UserMediaKycEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  documentType: string;

  @Column()
  documentUrl: string;

  @Column({ type: "int", enum: KYC_STATUS, default: KYC_STATUS.PENDING })
  status: number;

  // Relations
  @ManyToOne(() => UsersEntity, (user) => user.mediaKyc)
  @JoinColumn()
  user: UsersEntity;

  @ManyToOne(() => UserKycEntity, (userKyc) => userKyc.mediaKyc)
  @JoinColumn()
  userKyc: UserKycEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    const prefix = this.getDocumentPrefix();
    this.id = `${prefix}_${getUlidId(ID_TYPE.MEDIA_KYC)}`;
  }

  private getDocumentPrefix(): string {
    switch (this.documentType) {
      case "panCard":
        return "pan";
      case "aadharNumber":
        return "aa";
      case "addressProof":
        return "ap";
      case "bankStatement":
        return "bs";
      default:
        return "doc";
    }
  }
}
