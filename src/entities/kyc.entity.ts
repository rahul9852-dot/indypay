import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { UsersEntity } from "./user.entity";

@Entity("kyc")
export class KycEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  kycStatus: string;

  @Column({ nullable: true })
  panId: string;

  @Column({ nullable: true })
  aadharId: string;

  @Column({ nullable: true })
  addressProofId: string;

  @Column({ nullable: true })
  bankStatementId: string;

  @OneToOne(() => UsersEntity)
  @JoinColumn()
  user: UsersEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
