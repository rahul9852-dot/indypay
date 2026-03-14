import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";

import { AuthGuard } from "./guard/auth.guard";
import { RolesGuard } from "./guard/roles.guard";
import { PaginationGuard } from "./guard/pagination.guard";
import { AppController } from "./app.controller";
import { migrationConfig } from "./config/migration.config";
import { PayoutModule } from "./modules/payout/payout.module";
import { InvoiceModule } from "./modules/invoices/invoice.module";
import { WalletsModule } from "./modules/wallets/wallets.module";
import { CustomerModule } from "./modules/customers/customer.module";
import { ItemModule } from "./modules/items/item.module";
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
import { AnalyticsModule } from "@/modules/analytics/analytics.module";
import { DisabledEndpointInterceptor } from "@/interceptors/disabled-endpoint.interceptor";
import { CacheMonitorModule } from "@/shared/cache-monitor/cache-monitor.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ".env",
    }),
    // S-2: Rate limiting applied globally. Three named tiers let individual
    // endpoints override with stricter limits via @Throttle() without losing
    // the base protection on every other route.
    ThrottlerModule.forRoot([
      {
        // General API protection — 120 req/min per IP across all routes.
        name: "default",
        ttl: 60_000,
        limit: 120,
      },
      {
        // OTP tier — send-signup-otp and send-forgot-password-otp both trigger
        // SMS/email sends that cost money; 5/min makes abuse economically
        // unattractive without blocking real users.
        name: "otp",
        ttl: 60_000,
        limit: 5,
      },
      {
        // Contact tier — POST /users/contact fires SES emails; 5/min stops
        // automated spam campaigns without affecting legitimate enquiries.
        name: "contact",
        ttl: 60_000,
        limit: 5,
      },
    ]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "src/modules/payments/templates"),
      serveRoot: "/templates",
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
    ItemModule,
    ReportsModule,
    AnalyticsModule,
    CacheMonitorModule,
  ],
  controllers: [AppController],
  providers: [
    JwtService,

    // ThrottlerGuard must be first so rate-limit rejections happen before
    // auth/role guards run — avoids leaking auth errors on flooded endpoints.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
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
