import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";

import { AuthService } from "./auth.service";
import { UsersAuthController } from "./users-auth.controller";
import { InternalsAuthController } from "./internals-auth.controller";
import { UsersEntity } from "@/entities/users.entity";
import { BusinessDetailsEntity } from "@/entities/business-details.entity";
import { InternalUsersEntity } from "@/entities/internal-users.entity";
import { UsersService } from "@/modules/users/users.service";
import { NotificationService } from "@/shared/notification/notification.service";
import { VerificationGateway } from "@/modules/gateway/verification.gateway";
import { MfAuthService } from "@/modules/mf-auth/mf-auth.service";
import { OnboardingUsersEntity } from "@/entities/onboarding-user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsersEntity,
      InternalUsersEntity,
      BusinessDetailsEntity,
      OnboardingUsersEntity,
    ]),
  ],
  providers: [
    AuthService,
    UsersService,
    JwtService,
    NotificationService,
    VerificationGateway,
    MfAuthService,
  ],
  controllers: [UsersAuthController, InternalsAuthController],
  exports: [AuthService, VerificationGateway],
})
export class AuthModule {}
