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
import { PAYMENT_STATUS } from "@/enums/payment.enum";

@Entity("payment_links")
@Index(["userId", "createdAt"])
export class PaymentLinkEntity {
  @PrimaryColumn()
  id: string;

  // ─── Core payment fields ────────────────────────────────────────────────

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column()
  email: string;

  @Column({ type: "text", nullable: true })
  name: string;

  @Column()
  mobile: string;

  /**
   * Optional merchant note shown on the payment page and PDF receipt.
   * e.g. "Invoice #1042 for October rice supply"
   */
  @Column({ type: "text", nullable: true })
  note: string | null;

  // ─── Partial payment support ─────────────────────────────────────────────

  /**
   * When true the customer may pay any amount ≥ minimumPartialAmount,
   * enabling advance + balance flows common in B2B India.
   */
  @Column({ type: "boolean", default: false })
  allowPartialPayment: boolean;

  /**
   * Minimum accepted partial amount (paise omitted — stored in rupees).
   * Only relevant when allowPartialPayment = true.
   */
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  minimumPartialAmount: number | null;

  // ─── Status & lifecycle ──────────────────────────────────────────────────

  @Index()
  @Column({ enum: PAYMENT_STATUS, default: PAYMENT_STATUS.PENDING })
  status: string;

  /** Set when a successful payment is linked back to this record. */
  @Column({ type: "timestamptz", nullable: true })
  paidAt: Date | null;

  // ─── Expiry ──────────────────────────────────────────────────────────────

  /** null = link never expires. */
  @Column({ type: "timestamptz", nullable: true })
  expiresAt: Date | null;

  // ─── Analytics ───────────────────────────────────────────────────────────

  /** Total number of times the public link URL was opened by a customer. */
  @Column({ type: "int", default: 0 })
  viewCount: number;

  // ─── Notifications ───────────────────────────────────────────────────────

  @Column({ type: "boolean", default: false })
  notifyOnEmail: boolean;

  @Column({ type: "boolean", default: false })
  notifyOnNumber: boolean;

  /** When true, a reminder is sent automatically 24h after last open if still unpaid. */
  @Column({ type: "boolean", default: false })
  autoReminderEnabled: boolean;

  // ─── Ownership ───────────────────────────────────────────────────────────

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => UsersEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: UsersEntity;

  // ─── Encrypted payload ───────────────────────────────────────────────────

  /**
   * AES-encrypted JSON snapshot of the link details served to the
   * unauthenticated customer-facing endpoint. Prevents tampering.
   */
  @Column({ type: "text" })
  encryptedData: string;

  // ─── Timestamps ──────────────────────────────────────────────────────────

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.PAYIN_KEY);
  }
}
