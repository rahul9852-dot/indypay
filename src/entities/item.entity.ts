import {
  Entity,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { InvoiceItemEntity } from "./invoice-item.entity";
import { UsersEntity } from "@/entities/user.entity";
import { ID_TYPE } from "@/enums";
import { getUlidId } from "@/utils/helperFunctions.utils";

@Entity("items")
export class ItemEntity {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column("decimal", { precision: 10, scale: 2 })
  price: number;

  @Column()
  hsnCode: string;

  @Column()
  merchantId: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => UsersEntity, (user) => user.items)
  merchant: UsersEntity;

  @OneToMany(() => InvoiceItemEntity, (invoiceItem) => invoiceItem.item)
  invoiceItems: InvoiceItemEntity[];

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.ITEMS);
  }
}
