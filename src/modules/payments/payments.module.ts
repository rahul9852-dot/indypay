import { JwtService } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module, forwardRef } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { CacheModule } from "@nestjs/cache-manager";

import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";
import { PayoutProcessor } from "./payout/processor/payments.processor";
import { PayoutProcessorGeopay } from "./payout/processor/geopay.processor";
import { PayoutProcessorDiasPay } from "./payout/processor/payments.processorv2";
import { PayoutProcessorBuckBox } from "./payout/processor/buckbox.processor";
import { PayoutProcessorRocky } from "./payout/processor/rockypayz.processor";
import { PayinProcessor } from "./payin/processor/payin.processor";
import { OnikPayinService } from "./payin/integrations/onik-payin.service";
import { GeoPayPayinService } from "./payin/integrations/geopay-payin.service";
import { UtkarshPayinService } from "./payin/integrations/utkarsh-payin.service";
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
import { DatabaseMonitorService } from "@/utils/db-monitor.utils";
import { IntegrationsModule } from "@/modules/integrations/integrations.module";
// import { PayinWalletEntity } from "@/entities/payin-wallet.entity";
import { CommissionsModule } from "@/modules/commissions/commissions.module";

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
      // PayinWalletEntity,
      SettlementsEntity,
      ApiCredentialsEntity,
      UserLoginIpsEntity,
      CheckoutEntity,
    ]),
    BullModule.registerQueue(
      { name: "payouts" },
      { name: "tpipay-payouts" },
      { name: "payouts-kds-payout" },
      { name: "buckbox-payouts" },
      { name: "Geopay-payouts" },
      { name: "rocky-payouts" },
      { name: "payin-orders" }, // Queue for async payin order creation
    ),
    CacheModule.register(),
    ThirdPartyAuthModule,
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
    PayoutProcessor,
    PayoutProcessorDiasPay,
    PayoutProcessorBuckBox,
    PayoutProcessorRocky,
    PayoutService,
    CryptoService,
    DatabaseMonitorService,
    PayoutProcessorGeopay,
    PayinProcessor, // Processor for async payin order creation
    // Payin integration services
    OnikPayinService,
    GeoPayPayinService,
    UtkarshPayinService,
  ],
  controllers: [PaymentsController],
  exports: [
    PaymentsService,
    // Export payin services so IntegrationsModule can use them
    OnikPayinService,
    GeoPayPayinService,
    UtkarshPayinService,
  ],
})
export class PaymentsModule {}
