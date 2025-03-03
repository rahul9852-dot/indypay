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

  @Column("int")
  quantity: number;

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
