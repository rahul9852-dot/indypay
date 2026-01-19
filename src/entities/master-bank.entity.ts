import {
  BeforeInsert,
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { PayinWalletLoadEntity } from "./payin-wallet-topup.entity";
import { ID_TYPE } from "@/enums";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ACTIVITY } from "@/enums/payment.enum";

@Entity("master_bank")
export class MasterBankEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  bankName: string;

  @Column()
  bankIFSC: string;

  @Column()
  accountNumber: string;

  @Column({ enum: ACTIVITY, default: ACTIVITY.ACTIVE })
  activity: ACTIVITY;

  @OneToMany(
    () => PayinWalletLoadEntity,
    ({ payinWalletLoads }) => payinWalletLoads,
    {
      cascade: true,
    },
  )
  payinWalletLoads: PayinWalletLoadEntity[];

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.USER_BANK_DETAILS_KEY);
  }
}
