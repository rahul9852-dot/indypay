import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_GUARD } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";

import { BusinessDetailsGuard } from "./guard/business-details.guard";
import { AuthGuard } from "./guard/auth.guard";
import { RolesGuard } from "./guard/roles.guard";
import { AppController } from "./app.controller";
import { migrationConfig } from "./config/migration.config";
import { appConfig } from "@/config/app.config";
import { dbConfig } from "@/config/db.config";
import { AuthModule } from "@/modules/auth/auth.module";
import { UsersModule } from "@/modules/users/users.module";
import { KycModule } from "@/modules/kyc/kyc.module";
import { PaymentsModule } from "@/modules/payments/payments.module";
import { UsersEntity } from "@/entities/user.entity";
import { KycGuard } from "@/guard/kyc.guard";
import { TransactionsModule } from "@/modules/transactions/transactions.module";

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
  ],
  controllers: [AppController],
  providers: [
    JwtService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
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
