import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";

import { MfAuthController } from "./mf-auth.controller";
import { MfAuthService } from "./mf-auth.service";
import { UsersService } from "@/modules/users/users.service";
import { UsersEntity } from "@/entities/users.entity";
import { BusinessDetailsEntity } from "@/entities/business-details.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UsersEntity, BusinessDetailsEntity])],
  controllers: [MfAuthController],
  providers: [MfAuthService, UsersService, JwtService],
})
export class MfAuthModule {}
