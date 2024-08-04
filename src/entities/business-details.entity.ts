import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { getUlidId } from "utils/helperFunctions.utils";
import { BUSINESS_TYPES } from "enums";

@Entity("business_details")
export class BusinessDetailsEntity {
  @PrimaryColumn()
  id: string;

  @Index({ unique: true })
  @Column({ unique: true })
  merchantId: string;

  @Column({ enum: BUSINESS_TYPES })
  businessType: number;

  @Column()
  businessName: string;

  @Column()
  currentAccount: number;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId("bus");
  }
}
