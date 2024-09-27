import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UsersEntity } from "./user.entity";
import { ID_TYPE } from "@/enums";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { encryptData } from "@/utils/encode-decode.utils";

@Entity("user_api_keys")
export class UserApiKeysEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  clientId: string;

  @Column()
  clientSecret: string;

  // Relations
  @ManyToOne(() => UsersEntity, ({ apiKeys }) => apiKeys, {
    onDelete: "CASCADE",
  })
  user: UsersEntity;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @BeforeInsert()
  async beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.USER_API_KEY);
    this.clientSecret = await encryptData(this.clientSecret);
  }
}
