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

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  async beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.USER_API_KEY);
  }
}
