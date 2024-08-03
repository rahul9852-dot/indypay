import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";

import { MerchantsEntity } from "entities/merchants.entity";
import { BcryptService } from "shared/bcrypt/bcrypt.service";
import { MerchantsController } from "./merchants.controller";
import { MerchantsService } from "./merchants.service";

@Module({
  imports: [TypeOrmModule.forFeature([MerchantsEntity])],
  controllers: [MerchantsController],
  providers: [MerchantsService, BcryptService, JwtService],
})
export class MerchantsModule {}
