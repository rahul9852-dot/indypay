import {
  BeforeInsert,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { UsersEntity } from "./user.entity";
import { SettlementsEntity } from "./settlements.entity";
import { ID_TYPE } from "@/enums";
import { getUlidId } from "@/utils/helperFunctions.utils";

@Entity("user_bank_details")
export class UserBankDetailsEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  mobile: string;

  @Column()
  bankName: string;

  @Column()
  bankIFSC: string;

  @Column()
  accountNumber: string;

  // Relations
  @ManyToOne(() => UsersEntity, ({ bankDetails }) => bankDetails, {
    onDelete: "CASCADE",
  })
  user: UsersEntity;

  @OneToMany(() => SettlementsEntity, ({ bankDetails }) => bankDetails, {
    cascade: true,
  })
  settlements: SettlementsEntity[];

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.USER_BANK_DETAILS_KEY);
  }
}
