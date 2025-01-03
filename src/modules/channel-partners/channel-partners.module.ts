import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { ChannelPartnersService } from "./channel-partners.service";
import { ChannelPartnersController } from "./channel-partners.controller";
import { UsersEntity } from "@/entities/user.entity";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { SettlementsEntity } from "@/entities/settlements.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsersEntity,
      PayInOrdersEntity,
      SettlementsEntity,
    ]),
  ],
  providers: [ChannelPartnersService],
  controllers: [ChannelPartnersController],
})
export class ChannelPartnersModule {}
