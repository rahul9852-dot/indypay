import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { SettlementsService } from "./settlements.service";
import { SettlementsController } from "./settlements.controller";
import { UsersEntity } from "@/entities/user.entity";
import { SettlementsEntity } from "@/entities/settlements.entity";
import { BanksService } from "@/modules/banks/banks.service";
import { UserBankDetailsEntity } from "@/entities/user-bank-details.entity";
import { WalletEntity } from "@/entities/wallet.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsersEntity,
      SettlementsEntity,
      UserBankDetailsEntity,
      WalletEntity,
    ]),
  ],
  providers: [SettlementsService, BanksService],
  controllers: [SettlementsController],
})
export class SettlementsModule {}
