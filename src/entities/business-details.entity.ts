import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UsersEntity } from "./users.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import {
  BUSINESS_ENTITY_TYPE,
  DESIGNATION,
  ID_TYPE,
  TURNOVER_TYPE,
} from "@/enums";
import { BUSINESS_INDUSTRIES } from "@/constants/business-industries.constant";

@Entity("business_details")
export class BusinessDetailsEntity {
  @PrimaryColumn()
  id: string;

  @Column({ enum: BUSINESS_ENTITY_TYPE, nullable: true })
  businessEntityType: number;

  @Column({ nullable: true })
  businessName: string;

  @Column({ enum: DESIGNATION, nullable: true })
  designation: string;

  @Column({ enum: TURNOVER_TYPE, nullable: true })
  turnover: number;

  @Column({ enum: BUSINESS_INDUSTRIES, nullable: true })
  industry: number;

  // Relations
  @OneToOne(() => UsersEntity, ({ businessDetails }) => businessDetails)
  user: UsersEntity;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.BUSINESS_DETAILS);
  }
}
