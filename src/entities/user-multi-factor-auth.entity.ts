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
import { ID_TYPE } from "@/enums";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { encryptData } from "@/utils/encode-decode.utils";

@Entity("user_multi_factor_auth")
export class UserMultiFactorAuthEntity {
  @PrimaryColumn()
  id: string;

  @Column({ select: false, comment: "2FA secret" })
  secret: string;

  // Relations
  @OneToOne(() => UsersEntity, ({ multiFactorAuth }) => multiFactorAuth, {
    onDelete: "CASCADE",
  })
  user: UsersEntity;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  async beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.USER_MULTI_FACTOR_AUTH);
    this.secret = await encryptData(this.secret);
  }
}
