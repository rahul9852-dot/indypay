import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";

import { MerchantsEntity } from "entities/merchants.entity";
import { BusinessDetailsEntity } from "entities/business-details.entity";
import { OtpEntity } from "entities/otp.entity";
import { BcryptService } from "shared/bcrypt/bcrypt.service";
import { MerchantsService } from "./merchants.service";
import { MerchantsControllerMerchant } from "./merchants.controller";
import { MerchantsControllerOps } from "./ops.controller";
import { MerchantsControllerAdmin } from "./admin.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MerchantsEntity,
      OtpEntity,
      BusinessDetailsEntity,
    ]),
  ],
  controllers: [
    MerchantsControllerMerchant,
    MerchantsControllerOps,
    MerchantsControllerAdmin,
  ],
  providers: [MerchantsService, BcryptService, JwtService],
})
export class MerchantsModule {}
