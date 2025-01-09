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
import { UserKycEntity } from "./user-kyc.entity";
import { ID_TYPE } from "@/enums";
import { getUlidId } from "@/utils/helperFunctions.utils";

@Entity("user_media")
export class UserMediaEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  documentType: string;

  @Column()
  documentUrl: string;

  @Column()
  documentName: string;

  // Relations
  @JoinColumn()
  @ManyToOne(() => UserKycEntity, ({ media }) => media, {
    onDelete: "CASCADE",
  })
  kyc: UserKycEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = getUlidId(ID_TYPE.MEDIA_KYC);
  }
}
