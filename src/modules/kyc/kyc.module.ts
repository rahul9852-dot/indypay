import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { KycController } from "./kyc.controller";
import { KycService } from "./kyc.service";
import { AuthModule } from "@/modules/auth/auth.module";
import { appConfig } from "@/config/app.config";
import { UsersEntity } from "@/entities/user.entity";
import { KycEntity } from "@/entities/kyc.entity";
import { AwsModule } from "@/modules/aws/aws.module";
import { UserMediaKycEntity } from "@/entities/user-media-kyc.entity";
import { UserBusinessDetailsEntity } from "@/entities/user-business.entity";
import { UserKycEntity } from "@/entities/user-kyc.entity";

const {
  jwtConfig: { accessTokenSecret },
} = appConfig();

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsersEntity,
      KycEntity,
      UserMediaKycEntity,
      UserBusinessDetailsEntity,
      UserKycEntity,
    ]),
    JwtModule.register({
      secret: accessTokenSecret,
    }),
    AwsModule,
    AuthModule,
  ],
  providers: [KycService],
  controllers: [KycController],
})
export class KycModule {}
