import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { TransactionsService } from "./transactions.service";
import { TransactionsController } from "./transactions.controller";
import { TransactionsEntity } from "@/entities/transaction.entity";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { SettlementsEntity } from "@/entities/settlements.entity";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransactionsEntity,
      PayInOrdersEntity,
      PayOutOrdersEntity,
      SettlementsEntity,
    ]),
  ],
  providers: [TransactionsService],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
