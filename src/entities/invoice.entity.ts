import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { CustomerEntity } from "./invoice-customer.entity";
import { InvoiceItemEntity } from "./invoice-item.entity";
import { UsersEntity } from "@/entities/user.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE, INVOICE_STATUS } from "@/enums";

export type RecurringFrequency = "WEEKLY" | "MONTHLY" | "QUARTERLY";

export interface RecurringConfig {
  frequency: RecurringFrequency;
  /** How many frequency-units between each invoice. E.g. interval=2 + MONTHLY = every 2 months. */
  interval: number;
  /** Date after which no more invoices are auto-generated (inclusive). */
  endDate?: string;
  /** ISO date of the next auto-generation run. */
  nextInvoiceDate?: string;
}

@Entity("invoices")
export class InvoiceEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  invoiceNumber: string;

  @Column({ nullable: true })
  description: string;

  // ── Tax breakdown ────────────────────────────────────────────────────────────

  /** Pre-tax subtotal — sum of all (rate × quantity) across items. */
  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    nullable: true,
  })
  subtotalAmount: number;

  /** Sum of CGST across all items (intra-state invoices). */
  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    nullable: true,
  })
  cgstAmount: number;

  /** Sum of SGST across all items (intra-state invoices). */
  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    nullable: true,
  })
  sgstAmount: number;

  /** Sum of IGST across all items (inter-state invoices). */
  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    nullable: true,
  })
  igstAmount: number;

  /** Total tax = cgstAmount + sgstAmount + igstAmount */
  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    nullable: true,
  })
  totalTaxAmount: number;

  /**
   * Grand total (subtotalAmount + totalTaxAmount).
   * Kept for backward compatibility with existing API consumers.
   */
  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    nullable: true,
  })
  totalAmount: number;

  // ── Invoice meta ─────────────────────────────────────────────────────────────

  @Column({ nullable: true })
  customerNotes?: string;

  @Column({ type: "text", nullable: true })
  termsAndServices: string;

  @Column({ nullable: true })
  shippingAddress: string;

  @Column({ nullable: true })
  billingAddress: string;

  @Column({ type: "enum", enum: INVOICE_STATUS, default: INVOICE_STATUS.DRAFT })
  status: INVOICE_STATUS;

  @Column({ type: "timestamptz", nullable: true })
  issueDate: Date;

  /** Payment due date shown on the PDF. Replaces the old expiryDate semantics. */
  @Column({ type: "timestamptz", nullable: true })
  expiryDate: Date;

  // ── Payment status tracking ──────────────────────────────────────────────────

  /** Timestamp when the customer first opened the invoice email. */
  @Column({ type: "timestamptz", nullable: true })
  viewedAt: Date | null;

  /** Timestamp when the invoice was marked as paid. */
  @Column({ type: "timestamptz", nullable: true })
  paidAt: Date | null;

  /** Timestamp of the most recent reminder email sent to the customer. */
  @Column({ type: "timestamptz", nullable: true })
  reminderSentAt: Date | null;

  // ── Recurring invoices ───────────────────────────────────────────────────────

  /** When true, this invoice is a template that repeats on recurringConfig.frequency. */
  @Column({ type: "boolean", default: false })
  isRecurring: boolean;

  /**
   * Recurring schedule configuration.
   * Only populated when isRecurring = true.
   */
  @Column({ type: "jsonb", nullable: true })
  recurringConfig: RecurringConfig | null;

  // ── Relations ────────────────────────────────────────────────────────────────

  @ManyToOne(() => UsersEntity, ({ invoices }) => invoices, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "merchantId" })
  user: UsersEntity;

  @ManyToOne(() => CustomerEntity, ({ invoices }) => invoices, {
    cascade: true,
  })
  @JoinColumn({ name: "customerId" })
  customer: CustomerEntity;

  @OneToMany(() => InvoiceItemEntity, (invoiceItem) => invoiceItem.invoice, {
    cascade: true,
  })
  items: InvoiceItemEntity[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.INVOICES);
  }
}
