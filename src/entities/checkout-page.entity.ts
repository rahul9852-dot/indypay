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
  type: string; // text, number, email, select, etc.
  required: boolean;
  options?: string[]; // for type=select
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

  // ─── Branding ────────────────────────────────────────────────────────────

  /** Internal name for the merchant to identify this page in their dashboard. */
  @Column({ type: "varchar", length: 255, nullable: true })
  name: string;

  /** Merchant's logo URL displayed at the top of the checkout page. */
  @Column({ type: "text", nullable: true })
  logoUrl: string;

  /** Headline shown to the customer on the checkout page. */
  @Column({ type: "varchar", length: 500 })
  title: string;

  /**
   * Rich text / HTML from editor (bold, italic, underline, lists, etc.)
   * Shown below the title as a description of what the customer is paying for.
   */
  @Column({ type: "text", nullable: true })
  pageDescription: string;

  /**
   * Primary brand colour used for the pay button, header accent, and links.
   * Stored as a hex code — e.g. "#6366F1".
   * Defaults to RupeeFlow brand blue if not set.
   */
  @Column({ type: "varchar", length: 9, nullable: true, default: "#6366F1" })
  primaryColor: string;

  /**
   * Label on the pay button — lets merchants match their brand voice.
   * Examples: "Pay Now", "Donate", "Subscribe", "Buy Now".
   */
  @Column({ type: "varchar", length: 50, nullable: true, default: "Pay Now" })
  buttonText: string;

  // ─── Contact ─────────────────────────────────────────────────────────────

  @Column({ type: "varchar", length: 20, nullable: true })
  contactMobile: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  contactEmail: string;

  /** Rich text / HTML from editor */
  @Column({ type: "text", nullable: true })
  termsAndConditions: string;

  // ─── Amount config ────────────────────────────────────────────────────────

  @Column({
    type: "enum",
    enum: CheckoutAmountType,
    default: CheckoutAmountType.USER_ENTERED,
  })
  amountType: CheckoutAmountType;

  /** Amount in rupees — only relevant when amountType = FIXED. */
  @Column({
    type: "decimal",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  fixedAmount: number | null;

  /**
   * Minimum amount a customer can enter (only applies when amountType = USER_ENTERED).
   * Prevents ₹1 test payments from flooding merchant dashboards.
   */
  @Column({
    type: "decimal",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  minimumAmount: number | null;

  // ─── Form fields ─────────────────────────────────────────────────────────

  /**
   * When true, the checkout form shows a delivery address section.
   * Useful for physical goods merchants.
   */
  @Column({ type: "boolean", default: false })
  collectAddress: boolean;

  /**
   * Extra custom fields beyond the standard name/email/mobile.
   * Array of { key, label, type, required, options? }
   */
  @Column({ type: "jsonb", nullable: true, default: [] })
  customFields: CheckoutCustomField[];

  // ─── Post-payment behaviour ───────────────────────────────────────────────

  /**
   * Customer is redirected here after a successful payment.
   * If null, the built-in RupeeFlow success screen is shown.
   */
  @Column({ type: "text", nullable: true })
  successRedirectUrl: string | null;

  /**
   * Customer is redirected here after a failed / cancelled payment.
   * If null, the built-in RupeeFlow failure screen is shown.
   */
  @Column({ type: "text", nullable: true })
  failureRedirectUrl: string | null;

  /**
   * Custom thank-you message shown on the success screen.
   * E.g. "Thank you! Your order will ship in 2–3 days."
   */
  @Column({ type: "varchar", length: 500, nullable: true })
  successMessage: string | null;

  // ─── Status & lifecycle ───────────────────────────────────────────────────

  @Column({
    type: "enum",
    enum: CheckoutPageStatus,
    default: CheckoutPageStatus.DRAFT,
  })
  status: CheckoutPageStatus;

  // ─── Timestamps ───────────────────────────────────────────────────────────

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.CHECKOUT_PAGE);
  }
}
