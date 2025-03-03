import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UsersEntity } from "./user.entity";
import { ID_TYPE } from "@/enums";
import { getUlidId } from "@/utils/helperFunctions.utils";

@Entity("wallets")
export class WalletEntity {
  @PrimaryColumn()
  id: string;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  totalCollections: number;

  // PAYOUT
  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  availablePayoutBalance: number;

  @Index()
  @Column()
  userId: string;

  // Relations
  @OneToOne(() => UsersEntity, ({ wallet }) => wallet, {
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
    this.id = getUlidId(ID_TYPE.WALLET);
  }
}
