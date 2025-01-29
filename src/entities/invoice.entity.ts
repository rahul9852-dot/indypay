import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { CustomerEntity } from "./invoice-customer.entity";
import { UsersEntity } from "@/entities/user.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE, INVOICE_STATUS } from "@/enums";

@Entity("invoices")
export class InvoiceEntity {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column()
  description: string;

  @Column({
    type: "numeric",
    precision: 15,
    scale: 2,
    default: 0,
  })
  totalAmount: number;

  @Column({ nullable: true })
  customerNotes?: string;

  @Column({ type: "text" })
  termsAndServices: string;

  @Column()
  shippingAddress: string;

  @Column()
  billingAddress: string;

  @Column({ type: "enum", enum: INVOICE_STATUS, default: INVOICE_STATUS.DRAFT })
  status: INVOICE_STATUS;

  @Column({ type: "timestamptz" })
  issueDate: Date;

  @Column({ type: "timestamptz" })
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

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.INVOICES);
  }
}
