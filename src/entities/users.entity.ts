import { Roles, Status } from "enums";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("users")
export class UsersEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Index({ unique: true })
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  contactNo: string;

  @Column({ default: false })
  isOTPVerified: boolean;

  @Column({ default: false })
  isKycVerified: boolean;

  @Column({ enum: Roles, default: Roles.Merchant })
  role: number;

  @Column({ enum: Status, default: Status.Active })
  status: number;

  @Column({ nullable: true })
  image?: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
