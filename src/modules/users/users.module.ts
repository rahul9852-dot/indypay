import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";

import { UsersService } from "./users.service";
import { UsersSelfController } from "./users-self.controller";
import { UsersInternalController } from "./users-internal.controller";
import { UsersEntity } from "@/entities/users.entity";
import { BusinessDetailsEntity } from "@/entities/business-details.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UsersEntity, BusinessDetailsEntity])],
  controllers: [UsersSelfController, UsersInternalController],
  providers: [UsersService, JwtService],
})
export class UsersModule {}
