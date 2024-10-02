import { BeforeInsert, Column, Entity, OneToOne, PrimaryColumn } from "typeorm";
import { UsersEntity } from "./user.entity";
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
  @OneToOne(() => UsersEntity, ({ bankDetails }) => bankDetails, {
    onDelete: "CASCADE",
  })
  user: UsersEntity;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.USER_BANK_DETAILS_KEY);
  }
}
