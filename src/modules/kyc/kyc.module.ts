import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { KycService } from "./kyc.service";
import { KycController } from "./kyc.controller";
import { UsersEntity } from "@/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UsersEntity])],
  providers: [KycService],
  controllers: [KycController],
})
export class KycModule {}
