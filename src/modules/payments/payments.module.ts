import { JwtService } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";

import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";
import { PayoutProcessor } from "./payments.processor";
import { SESService } from "@/modules/aws/ses.service";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { UsersEntity } from "@/entities/user.entity";
import { UsersService } from "@/modules/users/users.service";
import { AuthService } from "@/modules/auth/auth.service";
import { AuthOtpEntity } from "@/entities/otp.entity";
import { BcryptService } from "@/shared/bcrypt/bcrypt.service";
import { UserApiKeysEntity } from "@/entities/user-api-key.entity";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import { UserBankDetailsEntity } from "@/entities/user-bank-details.entity";
import { UserWhitelistIpsEntity } from "@/entities/user-whitelist-ip.entity";
import { UserAddressEntity } from "@/entities/user-address.entity";
import { WalletEntity } from "@/entities/wallet.entity";
import { SettlementsEntity } from "@/entities/settlements.entity";
import { SNSService } from "@/modules/aws/sns.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransactionsEntity,
      UsersEntity,
      AuthOtpEntity,
      UserApiKeysEntity,
      PayInOrdersEntity,
      PayOutOrdersEntity,
      UserBankDetailsEntity,
      UserWhitelistIpsEntity,
      UserAddressEntity,
      WalletEntity,
      SettlementsEntity,
    ]),
    BullModule.registerQueue({
      name: "payouts",
    }),
  ],
  providers: [
    PaymentsService,
    UsersService,
    AuthService,
    BcryptService,
    JwtService,
    SNSService,
    SESService,
    PayoutProcessor,
  ],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
