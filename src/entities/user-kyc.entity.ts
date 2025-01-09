import {
  BeforeInsert,
  CreateDateColumn,
  Entity,
  OneToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserMediaEntity } from "./user-media-kyc.entity";
import { UsersEntity } from "./user.entity";
import { ID_TYPE } from "@/enums";
import { getUlidId } from "@/utils/helperFunctions.utils";

@Entity("user_kyc")
export class UserKycEntity {
  @PrimaryColumn()
  id: string;

  // Relations
  @OneToOne(() => UsersEntity, ({ kyc }) => kyc, {
    onDelete: "CASCADE",
  })
  user: UsersEntity;

  @OneToMany(() => UserMediaEntity, ({ kyc }) => kyc, {
    cascade: true,
  })
  media: UserMediaEntity[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = getUlidId(ID_TYPE.USER_KYC);
  }
}
