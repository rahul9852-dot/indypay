import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { BanksService } from "./banks.service";
import { BanksController } from "./banks.controller";
import { UserBankDetailsEntity } from "@/entities/user-bank-details.entity";
import { UsersEntity } from "@/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UserBankDetailsEntity, UsersEntity])],
  providers: [BanksService],
  controllers: [BanksController],
})
export class BanksModule {}
