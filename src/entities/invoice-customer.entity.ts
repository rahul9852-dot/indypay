import {
  Entity,
  Column,
  OneToMany,
  PrimaryColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { InvoiceEntity } from "./invoice.entity";
import { UsersEntity } from "./user.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";

@Entity("invoice_customers")
export class CustomerEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, nullable: true })
  gstin?: string;

  @Column({ length: 15, unique: true })
  contactNumber: string;

  @Column()
  addressLine1: string;

  @Column({ nullable: true })
  addressLine2?: string;

  @Column({ length: 10 })
  pincode: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  country: string;

  @Column()
  merchantId: string;

  @ManyToOne(() => UsersEntity, (user) => user.customers, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "merchantId" })
  merchant: UsersEntity;

  @OneToMany(() => InvoiceEntity, (invoice) => invoice.customer)
  invoices: InvoiceEntity[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.CUSTOMER);
  }
}
