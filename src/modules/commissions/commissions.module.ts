import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CacheModule } from "@nestjs/cache-manager";
import Redis from "ioredis";
import { CommissionService } from "./commission.service";
import { CommissionsController } from "./commissions.controller";
import { CommissionEntity } from "@/entities/commission.entity";
import { CommissionSlabEntity } from "@/entities/commission-slab.entity";
import { UserCommissionMappingEntity } from "@/entities/user-commission-mapping.entity";
import { UsersEntity } from "@/entities/user.entity";
import { AuthModule } from "@/modules/auth/auth.module";
import { PaymentsModule } from "@/modules/payments/payments.module";
import { appConfig } from "@/config/app.config";

const { redisConfig } = appConfig();

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommissionEntity,
      CommissionSlabEntity,
      UserCommissionMappingEntity,
      UsersEntity,
    ]),
    CacheModule.register(),
    AuthModule,
    forwardRef(() => PaymentsModule), // For circular dependency resolution
  ],
  providers: [
    {
      provide: "REDIS_CLIENT",
      useFactory: () => {
        return new Redis({
          host: redisConfig.redisHostUrl,
          port: redisConfig.redisPort,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);

            return delay;
          },
          maxRetriesPerRequest: 3,
        });
      },
    },
    CommissionService,
  ],
  controllers: [CommissionsController],
  exports: [CommissionService],
})
export class CommissionsModule {}
