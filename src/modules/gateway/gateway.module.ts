import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";

import { VerificationGateway } from "./verification.gateway";
import { AuthService } from "@/modules/auth/auth.service";
import { UsersEntity } from "@/entities/users.entity";
import { InternalUsersEntity } from "@/entities/internal-users.entity";
import { BusinessDetailsEntity } from "@/entities/business-details.entity";
import { OnboardingUsersEntity } from "@/entities/onboarding-user.entity";
import { UsersService } from "@/modules/users/users.service";
import { NotificationService } from "@/shared/notification/notification.service";
import { MfAuthService } from "@/modules/mf-auth/mf-auth.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsersEntity,
      InternalUsersEntity,
      BusinessDetailsEntity,
      OnboardingUsersEntity,
    ]),
  ],
  controllers: [],
  providers: [
    VerificationGateway,
    AuthService,
    UsersService,
    JwtService,
    NotificationService,
    MfAuthService,
  ],
  exports: [VerificationGateway, AuthService],
})
export class GatewayModule {}
