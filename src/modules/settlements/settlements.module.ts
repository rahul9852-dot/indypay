import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { SettlementsService } from "./settlements.service";
import { SettlementsController } from "./settlements.controller";
import { UsersEntity } from "@/entities/user.entity";
import { SettlementsEntity } from "@/entities/settlements.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UsersEntity, SettlementsEntity])],
  providers: [SettlementsService],
  controllers: [SettlementsController],
})
export class SettlementsModule {}
