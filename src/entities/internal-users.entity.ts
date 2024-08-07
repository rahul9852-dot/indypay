import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { INTERNALS_ROLE, ACCOUNT_STATUS, ID_TYPE } from "@/enums";
import { getUlidId } from "@/utils/helperFunctions.utils";

@Entity("internal_users")
export class InternalUsersEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  fullName: string;

  @Index({ unique: true })
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ unique: true })
  mobile: string;

  @Column({ enum: ACCOUNT_STATUS, default: ACCOUNT_STATUS.ACTIVE })
  status: number;

  @Column({ enum: INTERNALS_ROLE, default: INTERNALS_ROLE.GUEST })
  role: number;

  @Column({ nullable: true })
  image?: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.INTERNAL_USER);
  }
}
