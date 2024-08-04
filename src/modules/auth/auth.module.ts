import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";

import { MerchantsEntity } from "entities/merchants.entity";
import { OtpEntity } from "entities/otp.entity";
import { BusinessDetailsEntity } from "entities/business-details.entity";
import { MerchantsService } from "modules/merchants/merchants.service";
import { BcryptService } from "shared/bcrypt/bcrypt.service";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MerchantsEntity,
      OtpEntity,
      BusinessDetailsEntity,
    ]),
  ],
  providers: [AuthService, MerchantsService, BcryptService, JwtService],
  controllers: [AuthController],
})
export class AuthModule {}
