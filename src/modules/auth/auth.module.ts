import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { CacheModule, CacheStore } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-yet";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UsersEntity } from "@/entities/user.entity";
import { AuthOtpEntity } from "@/entities/otp.entity";
import { BcryptService } from "@/shared/bcrypt/bcrypt.service";
import { appConfig } from "@/config/app.config";
import { LOCK_TIME } from "@/constants/redis-cache.constant";

const { redisConfig } = appConfig();

@Module({
  imports: [
    TypeOrmModule.forFeature([UsersEntity, AuthOtpEntity]),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const store = await redisStore({
          socket: {
            host: redisConfig.redisHostUrl,
            port: redisConfig.redisPort,
          },
        });

        return {
          store: store as unknown as CacheStore,
          ttl: LOCK_TIME,
        };
      },
    }),
  ],
  providers: [AuthService, BcryptService, JwtService],
  controllers: [AuthController],
})
export class AuthModule {}
