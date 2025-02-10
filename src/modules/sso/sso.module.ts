import { JwtService } from "@nestjs/jwt";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SsoService } from "./sso.service";
import { SsoController } from "./sso.controller";
import { SESService } from "../aws/ses.service";
import { UsersEntity } from "@/entities/user.entity";
import { UsersService } from "@/modules/users/users.service";
import { UserApiKeysEntity } from "@/entities/user-api-key.entity";
import { UserBankDetailsEntity } from "@/entities/user-bank-details.entity";
import { UserWhitelistIpsEntity } from "@/entities/user-whitelist-ip.entity";
import { UserAddressEntity } from "@/entities/user-address.entity";
import { AuthService } from "@/modules/auth/auth.service";
import { BcryptService } from "@/shared/bcrypt/bcrypt.service";
import { AuthOtpEntity } from "@/entities/otp.entity";
import { SNSService } from "@/modules/aws/sns.service";
import { WalletEntity } from "@/entities/wallet.entity";
import { ApiCredentialsEntity } from "@/entities/api-credentials.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsersEntity,
      UserApiKeysEntity,
      UserBankDetailsEntity,
      UserWhitelistIpsEntity,
      UserAddressEntity,
      AuthOtpEntity,
      WalletEntity,
      ApiCredentialsEntity,
    ]),
  ],
  providers: [
    SsoService,
    UsersService,
    AuthService,
    BcryptService,
    JwtService,
    SNSService,
    SESService,
  ],
  controllers: [SsoController],
})
export class SsoModule {}
