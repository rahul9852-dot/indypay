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
import { MasterBankEntity } from "./master-bank.entity";
import { ID_TYPE } from "@/enums";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { MODE_OPTIONS } from "@/enums/payment.enum";

@Entity("payin-wallet-load")
@Index(["userId", "createdAt"])
export class PayinWalletLoadEntity {
  @PrimaryColumn()
  id: string;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    comment: "collection amount",
  })
  amount: number; // collection amount

  @Column()
  utr: string;

  @Column()
  status: string;

  @Index()
  @Column()
  userId: string;

  @Column()
  masterBankId: string;

  @Column({ enum: MODE_OPTIONS, default: MODE_OPTIONS.IMPS })
  mode: MODE_OPTIONS;

  @Column({ nullable: true })
  topupById: string;

  @ManyToOne(() => UsersEntity, { nullable: true })
  @JoinColumn({ name: "topupById" })
  topupBy: UsersEntity;

  @ManyToOne(
    () => MasterBankEntity,
    ({ payinWalletLoads }) => payinWalletLoads,
    {
      onDelete: "CASCADE",
    },
  )
  @JoinColumn({ name: "masterBankId" })
  payinWalletLoads: PayinWalletLoadEntity[];

  @ManyToOne(() => UsersEntity, ({ walletLoads }) => walletLoads, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: UsersEntity;

  @Index()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.WALLET_TOPUP);
  }
}
