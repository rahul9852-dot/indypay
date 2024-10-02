import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { SettlementsService } from "./settlements.service";
import { SettlementsController } from "./settlements.controller";
import { UsersEntity } from "@/entities/user.entity";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { PayoutBatchesEntity } from "@/entities/payout-batch.entity";
import { TransactionsEntity } from "@/entities/transaction.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsersEntity,
      PayInOrdersEntity,
      PayoutBatchesEntity,
      TransactionsEntity,
    ]),
  ],
  providers: [SettlementsService],
  controllers: [SettlementsController],
})
export class SettlementsModule {}
