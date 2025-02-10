import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  BeforeInsert,
  PrimaryColumn,
} from "typeorm";
import { UsersEntity } from "./user.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";

@Entity("api_credentials")
export class ApiCredentialsEntity {
  @PrimaryColumn()
  id: string;

  @Column({ type: "text" })
  credentials: string;

  @OneToOne(() => UsersEntity, ({ apiCredentials }) => apiCredentials, {
    onDelete: "CASCADE",
  })
  user: UsersEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.API_CREDENTIALS);
  }
}
