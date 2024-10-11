import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CollectionsService } from "./collections.service";
import { CollectionsController } from "./collections.controller";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";
import { UsersEntity } from "@/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([PayInOrdersEntity, UsersEntity])],
  providers: [CollectionsService],
  controllers: [CollectionsController],
})
export class CollectionsModule {}
