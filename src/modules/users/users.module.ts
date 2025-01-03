import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { UsersEntity } from "@/entities/user.entity";
import { AuthModule } from "@/modules/auth/auth.module";
import { AuthOtpEntity } from "@/entities/otp.entity";
import { BcryptService } from "@/shared/bcrypt/bcrypt.service";
import { UserApiKeysEntity } from "@/entities/user-api-key.entity";
import { UserBankDetailsEntity } from "@/entities/user-bank-details.entity";
import { UserWhitelistIpsEntity } from "@/entities/user-whitelist-ip.entity";
import { UserAddressEntity } from "@/entities/user-address.entity";
import { SNSService } from "@/modules/aws/sns.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsersEntity,
      AuthOtpEntity,
      UserApiKeysEntity,
      UserBankDetailsEntity,
      UserWhitelistIpsEntity,
      UserAddressEntity,
    ]),
    AuthModule,
  ],
  providers: [UsersService, BcryptService, JwtService, SNSService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
