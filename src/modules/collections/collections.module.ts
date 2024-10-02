import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CollectionsService } from "./collections.service";
import { CollectionsController } from "./collections.controller";
import { PayInOrdersEntity } from "@/entities/payin-orders.entity";

@Module({
  imports: [TypeOrmModule.forFeature([PayInOrdersEntity])],
  providers: [CollectionsService],
  controllers: [CollectionsController],
})
export class CollectionsModule {}
