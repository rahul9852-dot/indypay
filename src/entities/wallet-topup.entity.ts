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

@Entity("wallet-topup")
export class WalletTopupEntity {
  @PrimaryColumn()
  id: string;

  @Column({
    type: "numeric",
    precision: 15,
    scale: 2,
    default: 0,
  })
  amount: number;

  // Relations
  @ManyToOne(() => UsersEntity, ({ walletTopup }) => walletTopup, {
    onDelete: "CASCADE",
  })
  user: UsersEntity;

  @ManyToOne(() => UsersEntity, { nullable: true })
  topupBy: UsersEntity;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.WALLET);
  }
}
