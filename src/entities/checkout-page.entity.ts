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

export enum CheckoutAmountType {
  FIXED = "FIXED",
  USER_ENTERED = "USER_ENTERED",
}

export enum CheckoutPageStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
}

export interface CheckoutCustomField {
  key: string;
  label: string;
  type: string; // text, number, email, etc.
  required: boolean;
}

@Entity("checkout_pages")
@Index(["userId"])
export class CheckoutPageEntity {
  @PrimaryColumn()
  id: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => UsersEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: UsersEntity;

  @Column({ type: "varchar", length: 255, nullable: true })
  name: string;

  @Column({ type: "text", nullable: true })
  logoUrl: string;

  @Column({ type: "varchar", length: 500 })
  title: string;

  /** Rich text / HTML from editor (bold, italic, underline, lists, etc.) */
  @Column({ type: "text", nullable: true })
  pageDescription: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  contactMobile: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  contactEmail: string;

  /** Rich text / HTML from editor */
  @Column({ type: "text", nullable: true })
  termsAndConditions: string;

  @Column({
    type: "enum",
    enum: CheckoutAmountType,
    default: CheckoutAmountType.USER_ENTERED,
  })
  amountType: CheckoutAmountType;

  @Column({
    type: "decimal",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  fixedAmount: number | null;

  /** Extra custom fields (email and phone are always shown by default). Array of { key, label, type, required } */
  @Column({ type: "jsonb", nullable: true, default: [] })
  customFields: CheckoutCustomField[];

  @Column({
    type: "enum",
    enum: CheckoutPageStatus,
    default: CheckoutPageStatus.DRAFT,
  })
  status: CheckoutPageStatus;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.CHECKOUT_PAGE);
  }
}
