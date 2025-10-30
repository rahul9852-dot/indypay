import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-yet";
import { TransactionsService } from "./transactions.service";
import { TransactionsController } from "./transactions.controller";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { SettlementsEntity } from "@/entities/settlements.entity";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import { CacheMonitorModule } from "@/shared/cache-monitor/cache-monitor.module";
import { appConfig } from "@/config/app.config";

const {
  redisConfig: { redisHostUrl, redisPort },
} = appConfig();

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransactionsEntity,
      PayInOrdersEntity,
      PayOutOrdersEntity,
      SettlementsEntity,
    ]),
    CacheModule.register({
      store: redisStore,
      host: redisHostUrl,
      port: redisPort,
      isGlobal: false,
    }),
    CacheMonitorModule,
  ],
  providers: [TransactionsService],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
