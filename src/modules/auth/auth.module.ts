import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { JwtService } from "@nestjs/jwt";
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-yet";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { BcryptService } from "@/shared/bcrypt/bcrypt.service";
import { LOCK_TIME_MS } from "@/constants/redis-cache.constant";
import { AwsModule } from "@/modules/aws/aws.module";
import { UsersEntity } from "@/entities/user.entity";
import { AuthOtpEntity } from "@/entities/otp.entity";
import { SNSService } from "@/modules/aws/sns.service";
import { appConfig } from "@/config/app.config";
import { WalletEntity } from "@/entities/wallet.entity";
import { UserLoginIpsEntity } from "@/entities/user-login-ip.entity";

const {
  redisConfig: { redisHostUrl, redisPort },
} = appConfig();

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsersEntity,
      AuthOtpEntity,
      WalletEntity,
      UserLoginIpsEntity,
    ]),
    JwtModule.register({
      signOptions: { expiresIn: "1h" },
    }),
    CacheModule.register({
      store: redisStore,
      host: redisHostUrl,
      port: redisPort,
      ttl: LOCK_TIME_MS,
      isGlobal: true,
    }),
    AwsModule,
  ],
  providers: [AuthService, BcryptService, JwtService, SNSService],
  controllers: [AuthController],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
