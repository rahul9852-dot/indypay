import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WalletsService } from "./wallets.service";
import { WalletsController } from "./wallets.controller";
import { WalletEntity } from "@/entities/wallet.entity";
import { WalletTopupEntity } from "@/entities/wallet-topup.entity";
import { SettlementsEntity } from "@/entities/settlements.entity";
import { UsersEntity } from "@/entities/user.entity";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import { PayinWalletEntity } from "@/entities/payin-wallet.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WalletEntity,
      PayinWalletEntity,
      WalletTopupEntity,
      SettlementsEntity,
      UsersEntity,
      PayOutOrdersEntity,
    ]),
  ],
  providers: [WalletsService],
  controllers: [WalletsController],
  exports: [WalletsService],
})
export class WalletsModule {}
