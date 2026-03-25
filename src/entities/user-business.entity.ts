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
import { DirectorInfoDto } from "@/modules/kyc/dto/kyc.dto";

@Entity("user_business_details")
export class UserBusinessDetailsEntity {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  businessPan: string;

  @Column({ enum: BUSINESS_ENTITY_TYPE, nullable: true })
  businessEntityType: number;

  @Column({ nullable: true })
  businessName: string;

  @Column({ nullable: true })
  registerBusinessNumber: string;

  @Column({ enum: DESIGNATION, nullable: true })
  designation: string;

  @Column({ enum: TURNOVER_TYPE, nullable: true })
  turnover: number;

  @Column({ enum: BUSINESS_INDUSTRIES, nullable: true })
  businessIndustry: string;

  @Column({ nullable: true })
  companyPanNumber: string;

  @Column({ nullable: true })
  gstin: string;

  @Column({ nullable: true })
  websiteUrl: string;

  @Column("jsonb", { nullable: true })
  directors: DirectorInfoDto[];

  @Column({ nullable: true })
  moa: string;

  @Column({ nullable: true })
  aoa: string;

  @Column({ nullable: true })
  coi: string;

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
