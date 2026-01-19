import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CacheModule } from "@nestjs/cache-manager";
import { CommissionService } from "./commission.service";
import { CommissionsController } from "./commissions.controller";
import { CommissionEntity } from "@/entities/commission.entity";
import { CommissionSlabEntity } from "@/entities/commission-slab.entity";
import { UserCommissionMappingEntity } from "@/entities/user-commission-mapping.entity";
import { UsersEntity } from "@/entities/user.entity";
import { AuthModule } from "@/modules/auth/auth.module";
import { PaymentsModule } from "@/modules/payments/payments.module";

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
  providers: [CommissionService],
  controllers: [CommissionsController],
  exports: [CommissionService],
})
export class CommissionsModule {}
