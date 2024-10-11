import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserApiKeysEntity } from "./user-api-key.entity";
import { UserMultiFactorAuthEntity } from "./user-multi-factor-auth.entity";
import { UserBusinessDetailsEntity } from "./user-business.entity";
import { UserBankDetailsEntity } from "./user-bank-details.entity";
import { UserKycEntity } from "./user-kyc.entity";
import { UserAddressEntity } from "./user-address.entity";
import { PayInOrdersEntity } from "./payin-orders.entity";
import { PayOutOrdersEntity } from "./payout-orders.entity";
import { TransactionsEntity } from "./transaction.entity";
import { UserWhitelistIpsEntity } from "./user-whitelist-ip.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import {
  ONBOARDING_STATUS,
  ACCOUNT_STATUS,
  USERS_ROLE,
  ID_TYPE,
} from "@/enums";

@Entity("users")
export class UsersEntity {
  @PrimaryColumn()
  id: string;

  @Column({ length: 100 })
  fullName: string;

  @Index()
  @Column({ length: 100, unique: true })
  email: string;

  @Index()
  @Column({ unique: true })
  mobile: string;

  @Column({ select: false })
  password: string;

  @Column({ enum: ACCOUNT_STATUS, default: ACCOUNT_STATUS.ACTIVE })
  accountStatus: number;

  @Column({ enum: USERS_ROLE, default: USERS_ROLE.MERCHANT })
  role: number;

  @Column({ enum: ONBOARDING_STATUS, default: ONBOARDING_STATUS.SIGN_UP })
  onboardingStatus: number;

  @Column({ nullable: true, length: 255 })
  image?: string;

  @Column({ nullable: true })
  payInWebhookUrl?: string;

  @Column({ nullable: true })
  payOutWebhookUrl?: string;

  // Relations
  @OneToMany(() => PayInOrdersEntity, ({ user }) => user, { cascade: true })
  payInOrders: PayInOrdersEntity[];

  @OneToMany(() => PayOutOrdersEntity, ({ user }) => user, { cascade: true })
  payOutOrders: PayOutOrdersEntity[];

  @OneToMany(() => TransactionsEntity, ({ user }) => user, {
    cascade: true,
  })
  transactions: TransactionsEntity[];

  @OneToMany(() => UserWhitelistIpsEntity, ({ user }) => user, {
    cascade: true,
  })
  whitelistIps: UserWhitelistIpsEntity[];

  @JoinColumn()
  @OneToOne(() => UserBusinessDetailsEntity, ({ user }) => user, {
    cascade: true,
  })
  businessDetails: UserBusinessDetailsEntity;

  @JoinColumn()
  @OneToOne(() => UserMultiFactorAuthEntity, ({ user }) => user, {
    cascade: true,
  })
  multiFactorAuth: UserMultiFactorAuthEntity;

  @JoinColumn()
  @OneToOne(() => UserKycEntity, ({ user }) => user, { cascade: true })
  kyc: UserKycEntity;

  @JoinColumn()
  @OneToOne(() => UserBankDetailsEntity, ({ user }) => user, { cascade: true })
  bankDetails: UserBankDetailsEntity;

  @OneToMany(() => UserApiKeysEntity, ({ user }) => user, { cascade: true })
  apiKeys: UserApiKeysEntity[];

  @OneToMany(() => UserAddressEntity, ({ user }) => user, { cascade: true })
  address: UserAddressEntity[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.USER);
  }
}
