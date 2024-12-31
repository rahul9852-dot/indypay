import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { SettlementsService } from "./settlements.service";
import { SettlementsController } from "./settlements.controller";
import { UsersEntity } from "@/entities/user.entity";
import { SettlementsEntity } from "@/entities/settlements.entity";
import { BanksService } from "@/modules/banks/banks.service";
import { UserBankDetailsEntity } from "@/entities/user-bank-details.entity";
import { WalletEntity } from "@/entities/wallet.entity";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { EmailService } from "@/shared/services/email.service";
import { InvoiceService } from "@/shared/services/invoice.service";
import { UserAddressEntity } from "@/entities/user-address.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsersEntity,
      SettlementsEntity,
      UserBankDetailsEntity,
      WalletEntity,
      PayInOrdersEntity,
      UserAddressEntity,
    ]),
  ],
  providers: [SettlementsService, BanksService, EmailService, InvoiceService],
  controllers: [SettlementsController],
})
export class SettlementsModule {}
