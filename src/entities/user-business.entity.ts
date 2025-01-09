import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UsersEntity } from "./user.entity";
import { getUlidId } from "@/utils/helperFunctions.utils";
import {
  BUSINESS_ENTITY_TYPE,
  DESIGNATION,
  ID_TYPE,
  TURNOVER_TYPE,
} from "@/enums";
import { BUSINESS_INDUSTRIES } from "@/constants/business-industries.constant";

@Entity("user_business_details")
export class UserBusinessDetailsEntity {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  businessPan: string;

  @Column({ enum: BUSINESS_ENTITY_TYPE })
  businessEntityType: number;

  @Column()
  businessName: string;

  @Column()
  registerBusinessNumber: string;

  @Column({ enum: DESIGNATION })
  designation: string;

  @Column({ enum: TURNOVER_TYPE })
  turnover: number;

  @Column({ enum: BUSINESS_INDUSTRIES })
  businessIndustry: string;

  // Relations
  @OneToOne(() => UsersEntity, ({ businessDetails }) => businessDetails, {
    onDelete: "CASCADE",
  })
  user: UsersEntity;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.BUSINESS_DETAILS);
  }
}
