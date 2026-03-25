import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  PrimaryColumn,
} from "typeorm";
import { InvoiceEntity } from "./invoice.entity";
import { ItemEntity } from "./item.entity";
import { ID_TYPE } from "@/enums";
import { getUlidId } from "@/utils/helperFunctions.utils";

@Entity("invoice_items")
export class InvoiceItemEntity {
  @PrimaryColumn()
  id: string;

  /** Optional per-line description override (falls back to item.description). */
  @Column({ type: "varchar", length: 500, nullable: true })
  description: string | null;

  @Column("int")
  quantity: number;

  /**
   * Unit price snapshot at the time the invoice was created.
   * Stored so the invoice is immutable even if item.price changes later.
   */
  @Column({ type: "decimal", precision: 15, scale: 2 })
  rate: number;

  /**
   * GST rate slab applied to this line item (0 / 5 / 12 / 18 / 28).
   * Copied from item.gstRate at invoice creation time.
   */
  @Column({ type: "int", default: 18 })
  gstRate: number;

  /** rate × quantity — the pre-tax line total. */
  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  taxableAmount: number;

  /**
   * Central GST amount for this line (intra-state only).
   * = taxableAmount × gstRate / 2 / 100
   */
  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  cgstAmount: number;

  /**
   * State GST amount for this line (intra-state only).
   * = taxableAmount × gstRate / 2 / 100
   */
  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  sgstAmount: number;

  /**
   * Integrated GST amount for this line (inter-state only).
   * = taxableAmount × gstRate / 100
   */
  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  igstAmount: number;

  /** taxableAmount + cgstAmount + sgstAmount + igstAmount */
  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  totalAmount: number;

  @ManyToOne(() => ItemEntity, ({ invoiceItems }) => invoiceItems)
  @JoinColumn({ name: "itemId" })
  item: ItemEntity;

  @ManyToOne(() => InvoiceEntity, ({ items }) => items, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "invoiceId" })
  invoice: InvoiceEntity;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.INVOICE_ITEMS);
  }
}
