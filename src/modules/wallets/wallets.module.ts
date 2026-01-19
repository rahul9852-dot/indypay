import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WalletsService } from "./wallets.service";
import { WalletsController } from "./wallets.controller";
import { WalletEntity } from "@/entities/wallet.entity";
import { WalletTopupEntity } from "@/entities/wallet-topup.entity";
import { SettlementsEntity } from "@/entities/settlements.entity";
import { UsersEntity } from "@/entities/user.entity";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import { PayinWalletLoadEntity } from "@/entities/payin-wallet-topup.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WalletEntity,
      WalletTopupEntity,
      SettlementsEntity,
      UsersEntity,
      PayOutOrdersEntity,
      PayinWalletLoadEntity,
    ]),
  ],
  providers: [WalletsService],
  controllers: [WalletsController],
  exports: [WalletsService],
})
export class WalletsModule {}
