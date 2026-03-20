import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { KycController } from "./kyc.controller";
import { KycService } from "./kyc.service";
import { KarzaProvider } from "./verification/providers/karza/karza.provider";
import { KYC_PROVIDER_TOKEN } from "./verification/providers/kyc-provider.interface";
import { KycVerificationEntity } from "@/entities/kyc-verification.entity";
import { AuthModule } from "@/modules/auth/auth.module";
import { appConfig } from "@/config/app.config";
import { UsersEntity } from "@/entities/user.entity";
import { KycEntity } from "@/entities/kyc.entity";
import { AwsModule } from "@/modules/aws/aws.module";
import { UserMediaEntity } from "@/entities/user-media-kyc.entity";
import { UserBusinessDetailsEntity } from "@/entities/user-business.entity";
import { UserKycEntity } from "@/entities/user-kyc.entity";
import { SESService } from "@/modules/aws/ses.service";
import { SNSService } from "@/modules/aws/sns.service";

const {
  jwtConfig: { accessTokenSecret },
} = appConfig();

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsersEntity,
      KycEntity,
      UserMediaEntity,
      UserBusinessDetailsEntity,
      UserKycEntity,
      KycVerificationEntity,
    ]),
    JwtModule.register({
      secret: accessTokenSecret,
    }),
    AwsModule,
    AuthModule,
  ],
  providers: [
    KycService,
    SESService,
    SNSService,
    // Provider adapter — swap KarzaProvider for any other bureau
    // (Signzy, IDfy, etc.) without touching KycService or controller.
    {
      provide: KYC_PROVIDER_TOKEN,
      useClass: KarzaProvider,
    },
  ],
  controllers: [KycController],
  exports: [KycService],
})
export class KycModule {}
