import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";

import { AuthGuard } from "./guard/auth.guard";
import { RolesGuard } from "./guard/roles.guard";
import { PaginationGuard } from "./guard/pagination.guard";
import { AppController } from "./app.controller";
import { migrationConfig } from "./config/migration.config";
import { PayoutModule } from "./modules/payout/payout.module";
import { InvoiceModule } from "./modules/invoices/invoice.module";
import { WalletsModule } from "./modules/wallets/wallets.module";
import { CustomerModule } from "./modules/customers/customer.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { appConfig } from "@/config/app.config";
import { dbConfig } from "@/config/db.config";
import { AuthModule } from "@/modules/auth/auth.module";
import { UsersModule } from "@/modules/users/users.module";
import { KycModule } from "@/modules/kyc/kyc.module";
import { PaymentsModule } from "@/modules/payments/payments.module";
import { UsersEntity } from "@/entities/user.entity";
import { TransactionsModule } from "@/modules/transactions/transactions.module";
import { SettlementsModule } from "@/modules/settlements/settlements.module";
import { DocsModule } from "@/modules/docs/docs.module";
import { CollectionsModule } from "@/modules/collections/collections.module";
import { BanksModule } from "@/modules/banks/banks.module";
import { SsoModule } from "@/modules/sso/sso.module";
import { ChannelPartnersModule } from "@/modules/channel-partners/channel-partners.module";
import { DisabledEndpointInterceptor } from "@/interceptors/disabled-endpoint.interceptor";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ".env",
    }),
    TypeOrmModule.forRoot(dbConfig),
    TypeOrmModule.forRoot(migrationConfig),
    TypeOrmModule.forFeature([UsersEntity]),
    AuthModule,
    UsersModule,
    KycModule,
    PaymentsModule,
    TransactionsModule,
    SettlementsModule,
    DocsModule,
    CollectionsModule,
    BanksModule,
    SsoModule,
    ChannelPartnersModule,
    PayoutModule,
    InvoiceModule,
    WalletsModule,
    CustomerModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    JwtService,

    {
      provide: APP_GUARD,
      useClass: PaginationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DisabledEndpointInterceptor,
    },

    // {
    //   provide: APP_GUARD,
    //   useClass: BusinessDetailsGuard,
    // },
    // {
    //   provide: APP_GUARD,
    //   useClass: KycGuard,
    // },
  ],
})
export class AppModule {}
