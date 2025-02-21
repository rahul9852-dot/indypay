import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { ReportsController } from "./reports.controller";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";

@Module({
  imports: [TypeOrmModule.forFeature([PayInOrdersEntity, PayOutOrdersEntity])],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
