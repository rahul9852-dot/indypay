import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from "typeorm";
import { getUlidId } from "@/utils/helperFunctions.utils";
import { ID_TYPE } from "@/enums";

export enum PaymentLinkEventAction {
  ABANDONED = "ABANDONED",
  OPENED = "OPENED",
  PAID = "PAID"
}

@Entity("payment_link_events")
@Index(["linkId", "createdAt"])
export class PaymentLinkEventEntity {
  @PrimaryColumn()
  id: string;

  @Index()
  @Column()
  linkId: string;

  @Column({
    enum: PaymentLinkEventAction,
    default: PaymentLinkEventAction.OPENED,
  })
  action: PaymentLinkEventAction;

  /** Visitor IP — used for unique-visitor count. Null for system-generated events. */
  @Column({ type: "varchar", length: 64, nullable: true })
  ipAddress: string | null;

  /** City derived from geo-IP lookup. Null until geo-IP is wired in. */
  @Column({ type: "varchar", length: 100, nullable: true })
  city: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.PAYIN_KEY);
  }
}
