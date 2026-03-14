import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { SettlementsService } from "./settlements.service";
import { SettlementsController } from "./settlements.controller";
import { UsersEntity } from "@/entities/user.entity";
import { SettlementsEntity } from "@/entities/settlements.entity";
import { WalletEntity } from "@/entities/wallet.entity";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { EmailService } from "@/shared/services/email.service";
import { InvoiceService } from "@/shared/services/invoice.service";
import { UserAddressEntity } from "@/entities/user-address.entity";
import { WalletTopupEntity } from "@/entities/wallet-topup.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsersEntity,
      SettlementsEntity,
      WalletEntity,
      PayInOrdersEntity,
      UserAddressEntity,
      WalletTopupEntity,
    ]),
  ],
  providers: [SettlementsService, EmailService, InvoiceService],
  controllers: [SettlementsController],
})
export class SettlementsModule {}
