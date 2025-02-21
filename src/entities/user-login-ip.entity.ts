import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UsersEntity } from "./user.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";

@Entity("user_login_ips")
@Index(["userId", "createdAt"])
export class UserLoginIpsEntity {
  @PrimaryColumn()
  id: string;

  @Index()
  @Column()
  ipAddress: string;

  @Column({ default: false })
  isApproved: boolean;

  @Index()
  @Column()
  userId: string;

  // Relations
  @ManyToOne(() => UsersEntity, ({ loginIps }) => loginIps, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: UsersEntity;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.USER_WHITELIST_IP);
  }
}
