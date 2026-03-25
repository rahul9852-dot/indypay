import { JwtService } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module, forwardRef } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { CacheModule } from "@nestjs/cache-manager";

import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";
import { PayinProcessor } from "./payin/processor/payin.processor";
import { MerchantWebhookProcessor } from "./merchant-webhook.processor";
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
import { S3Service } from "@/modules/aws/s3.service";
import { PayoutService } from "@/modules/payout/payout.service";
import { ApiCredentialsEntity } from "@/entities/api-credentials.entity";
import { CheckoutEntity } from "@/entities/checkout.entity";
import { UserLoginIpsEntity } from "@/entities/user-login-ip.entity";
import { PaymentLinkEntity } from "@/entities/payment-link.entity";
import { CheckoutPageEntity } from "@/entities/checkout-page.entity";
import { PaymentLinkEventEntity } from "@/entities/payment-link-event.entity";
import { PaymentLinkReminderEntity } from "@/entities/payment-link-reminder.entity";
import { CryptoService } from "@/utils/encryption-algo.utils";
import { DatabaseMonitorService } from "@/utils/db-monitor.utils";
import { IntegrationsModule } from "@/modules/integrations/integrations.module";
import { CommissionsModule } from "@/modules/commissions/commissions.module";
import { PayinEventLogEntity } from "@/entities/payin-event-log.entity";

const {
  redisConfig: { redisHostUrl, redisPort },
} = appConfig();

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: redisHostUrl,
        port: redisPort,
      },
    }),
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
      PaymentLinkEntity,
      CheckoutPageEntity,
      PayinEventLogEntity,
      PaymentLinkEventEntity,
      PaymentLinkReminderEntity,
    ]),
    BullModule.registerQueue(
      { name: "payouts" },
      { name: "payin-orders" },
      { name: "merchant-webhooks" },
    ),
    CacheModule.register(),
    forwardRef(() => IntegrationsModule),
    forwardRef(() => CommissionsModule),
  ],
  providers: [
    PaymentsService,
    UsersService,
    AuthService,
    BcryptService,
    JwtService,
    SNSService,
    SESService,
    S3Service,
    PayoutService,
    CryptoService,
    DatabaseMonitorService,
    PayinProcessor,
    MerchantWebhookProcessor,
  ],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
