import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
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
import { SettlementsEntity } from "./settlements.entity";
import { WalletEntity } from "./wallet.entity";
import { WalletTopupEntity } from "./wallet-topup.entity";
import { CustomerEntity } from "./invoice-customer.entity";
import { ApiCredentialsEntity } from "./api-credentials.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import {
  ONBOARDING_STATUS,
  ACCOUNT_STATUS,
  USERS_ROLE,
  ID_TYPE,
} from "@/enums";
import { InvoiceEntity } from "@/entities/invoice.entity";
import { UserLoginIpsEntity } from "@/entities/user-login-ip.entity";

@Entity("users")
export class UsersEntity {
  @PrimaryColumn()
  id: string;

  @Column({ length: 100, default: "DEFAULT" })
  firstName: string;

  @Column({ length: 100, default: "DEFAULT" })
  lastName: string;

  @Column({ length: 200, default: "DEFAULT" })
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

  @Column({ default: false })
  isPayoutDisabledFromDashboard: boolean;

  @Column({ nullable: true, length: 255 })
  image?: string;

  @Column({ nullable: true })
  payInWebhookUrl?: string;

  @Column({ nullable: true })
  payOutWebhookUrl?: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 4.5,
  })
  commissionInPercentagePayin?: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 1.5,
  })
  commissionInPercentagePayout?: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 18,
  })
  gstInPercentagePayin?: number;

  @Column({ default: 0 })
  jumpingCount?: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 18,
  })
  gstInPercentagePayout?: number;

  // Relations
  @ManyToOne(() => UsersEntity, { nullable: true })
  @JoinColumn()
  channelPartner: UsersEntity;

  @Column({ nullable: true })
  channelPartnerId: string;

  @Column({ nullable: true, length: 45 })
  lastLoginIp: string;

  @Column({ type: "boolean", default: false })
  twoFactorEnabled: boolean;

  @OneToMany(() => PayInOrdersEntity, ({ user }) => user, { cascade: true })
  payInOrders: PayInOrdersEntity[];

  @OneToMany(() => PayOutOrdersEntity, ({ user }) => user, { cascade: true })
  payOutOrders: PayOutOrdersEntity[];

  @OneToMany(() => SettlementsEntity, ({ user }) => user, { cascade: true })
  settlements: SettlementsEntity[];

  @OneToMany(() => TransactionsEntity, ({ user }) => user, {
    cascade: true,
  })
  transactions: TransactionsEntity[];

  @OneToMany(() => UserWhitelistIpsEntity, ({ user }) => user, {
    cascade: true,
  })
  whitelistIps: UserWhitelistIpsEntity[];

  @OneToMany(() => UserLoginIpsEntity, ({ user }) => user, {
    cascade: true,
  })
  loginIps: UserLoginIpsEntity[];

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
  @OneToOne(() => WalletEntity, ({ user }) => user, {
    cascade: true,
  })
  wallet: WalletEntity;

  @JoinColumn()
  @OneToOne(() => ApiCredentialsEntity, ({ user }) => user, {
    cascade: true,
  })
  apiCredentials: ApiCredentialsEntity;

  @JoinColumn()
  @OneToOne(() => UserAddressEntity, ({ user }) => user, { cascade: true })
  address: UserAddressEntity;

  @JoinColumn()
  @OneToOne(() => UserKycEntity, ({ user }) => user, { cascade: true })
  kyc: UserKycEntity;

  @OneToMany(() => UserBankDetailsEntity, ({ user }) => user, { cascade: true })
  bankDetails: UserBankDetailsEntity[];

  @OneToMany(() => WalletTopupEntity, ({ user }) => user, { cascade: true })
  walletTopup: WalletTopupEntity[];

  @OneToMany(() => UserApiKeysEntity, ({ user }) => user, { cascade: true })
  apiKeys: UserApiKeysEntity[];

  @OneToMany(() => InvoiceEntity, ({ user }) => user, { cascade: true })
  invoices: InvoiceEntity[];

  @OneToMany(() => CustomerEntity, ({ merchant }) => merchant, {
    cascade: true,
  })
  customers: CustomerEntity[];

  @Column({ type: "timestamptz", nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.USER);
    this.fullName = `${this.firstName} ${this.lastName}`;
  }
}
