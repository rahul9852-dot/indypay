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

@Entity("invoices")
export class InvoiceEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  invoiceNumber: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    nullable: true,
  })
  totalAmount: number;

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

  @Column({ type: "timestamptz", nullable: true })
  expiryDate: Date;

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
