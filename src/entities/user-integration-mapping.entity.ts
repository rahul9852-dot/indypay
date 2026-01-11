import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UsersEntity } from "./user.entity";
import { IntegrationEntity } from "./integration.entity";
import { ID_TYPE } from "@/enums";
import { getUlidId } from "@/utils/helperFunctions.utils";

@Entity("user_integration_mappings")
@Index(["userId", "isActive"])
export class UserIntegrationMappingEntity {
  @PrimaryColumn()
  id: string;

  @Index()
  @Column()
  userId: string;

  @Index()
  @Column()
  integrationId: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  // Relations
  @ManyToOne(() => UsersEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: UsersEntity;

  @ManyToOne(
    () => IntegrationEntity,
    (integration) => integration.userMappings,
    {
      onDelete: "CASCADE",
    },
  )
  @JoinColumn({ name: "integrationId" })
  integration: IntegrationEntity;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    this.id = getUlidId(ID_TYPE.USER_INTEGRATION_MAPPING);
  }
}
