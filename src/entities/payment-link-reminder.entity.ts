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

export enum ReminderChannel {
  SMS = "SMS",
  WHATSAPP = "WHATSAPP"
}

export enum ReminderStatus {
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  SENT = "SENT"
}

@Entity("payment_link_reminders")
@Index(["linkId", "createdAt"])
export class PaymentLinkReminderEntity {
  @PrimaryColumn()
  id: string;

  @Index()
  @Column()
  linkId: string;

  @Column({ enum: ReminderChannel })
  channel: ReminderChannel;

  /** Recipient phone number (stored as-is, masked when returned to client). */
  @Column({ type: "varchar", length: 20 })
  recipient: string;

  @Column({ enum: ReminderStatus, default: ReminderStatus.SENT })
  status: ReminderStatus;

  @Column({ type: "timestamptz" })
  sentAt: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.PAYIN_KEY);
  }
}
