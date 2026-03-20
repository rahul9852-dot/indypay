import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CacheModule } from "@nestjs/cache-manager";
import { IntegrationMappingService } from "./integration-mapping.service";
import { IntegrationPayinRouterService } from "./integration-payin-router.service";
import { PGAdapterRegistry } from "./pg-adapter.registry";
import { CircuitBreakerService } from "./circuit-breaker.service";
import { IntegrationsController } from "./integrations.controller";
import { UserIntegrationMappingEntity } from "@/entities/user-integration-mapping.entity";
import { IntegrationEntity } from "@/entities/integration.entity";
import { UsersEntity } from "@/entities/user.entity";
import { PaymentsModule } from "@/modules/payments/payments.module";
import { AuthModule } from "@/modules/auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserIntegrationMappingEntity,
      IntegrationEntity,
      UsersEntity,
    ]),
    CacheModule.register(),
    AuthModule,
    forwardRef(() => PaymentsModule),
  ],
  providers: [
    IntegrationMappingService,
    IntegrationPayinRouterService,
    PGAdapterRegistry,
    CircuitBreakerService,
  ],
  controllers: [IntegrationsController],
  exports: [
    IntegrationMappingService,
    IntegrationPayinRouterService,
    PGAdapterRegistry,
    CircuitBreakerService,
  ],
})
export class IntegrationsModule {}
