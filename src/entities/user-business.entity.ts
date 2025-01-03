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
  KYC_STATUS,
} from "@/enums";
import { BUSINESS_INDUSTRIES } from "@/constants/business-industries.constant";

@Entity("user_business_details")
export class UserBusinessDetailsEntity {
  @PrimaryColumn()
  id: string;

  @Column({})
  personalPan: string;

  @Column({})
  personalEmailId: string;

  @Column({ nullable: true })
  businessType: string;

  @Column({})
  @Column({ enum: BUSINESS_ENTITY_TYPE })
  businessEntityType: number;

  @Column({})
  businessName: string;

  @Column({})
  registerBusinessNumber: string;

  @Column({ enum: DESIGNATION })
  designation: string;

  @Column({ enum: TURNOVER_TYPE })
  turnover: number;

  @Column({ enum: BUSINESS_INDUSTRIES })
  businessIndustry: string;

  @Column({ type: "int", enum: KYC_STATUS, default: KYC_STATUS.PENDING })
  kycStatus: number;

  @Column({ nullable: true })
  businessPan: string;

  // Relations
  @OneToOne(() => UsersEntity, ({ businessDetails }) => businessDetails)
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
