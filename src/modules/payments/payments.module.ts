import { JwtService } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-yet";

import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";
import { PayoutProcessor } from "./payments.processor";
import { appConfig } from "@/config/app.config";
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
import { PayoutService } from "@/modules/payout/payout.service";
import { ApiCredentialsEntity } from "@/entities/api-credentials.entity";
import { CheckoutEntity } from "@/entities/checkout.entity";
import { UserLoginIpsEntity } from "@/entities/user-login-ip.entity";
import { ThirdPartyAuthModule } from "@/shared/third-party-auth/third-party-auth.module";
import { CryptoService } from "@/utils/encryption-algo.utils";

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
      ApiCredentialsEntity,
      UserLoginIpsEntity,
      CheckoutEntity,
    ]),
    BullModule.registerQueue({
      name: "payouts",
    }),
    CacheModule.register({
      store: redisStore,
      host: appConfig().redisConfig.redisHostUrl,
      port: appConfig().redisConfig.redisPort,
      ttl: 3600000, // 1 hour default TTL
      isGlobal: true,
    }),
    ThirdPartyAuthModule,
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
    PayoutService,
    CryptoService,
  ],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
