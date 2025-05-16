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
import { ApiCredentialsEntity } from "@/entities/api-credentials.entity";
import { WalletTopupEntity } from "@/entities/wallet-topup.entity";
import { ThirdPartyAuthService } from "@/shared/third-party-auth/third-party-auth.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsersEntity,
      SettlementsEntity,
      UserBankDetailsEntity,
      WalletEntity,
      PayInOrdersEntity,
      UserAddressEntity,
      ApiCredentialsEntity,
      WalletTopupEntity,
    ]),
  ],
  providers: [
    SettlementsService,
    BanksService,
    EmailService,
    InvoiceService,
    ThirdPartyAuthService,
  ],
  controllers: [SettlementsController],
})
export class SettlementsModule {}
