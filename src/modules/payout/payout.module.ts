import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { PayoutService } from "./payout.service";
import { PayoutController } from "./payout.controller";
import { PayOutOrdersEntity } from "@/entities/payout-orders.entity";
import { UsersEntity } from "@/entities/user.entity";
import { ApiCredentialsEntity } from "@/entities/api-credentials.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PayOutOrdersEntity,
      UsersEntity,
      ApiCredentialsEntity,
    ]),
  ],
  providers: [PayoutService],
  controllers: [PayoutController],
})
export class PayoutModule {}
