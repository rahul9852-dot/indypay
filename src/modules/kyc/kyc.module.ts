import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { KycService } from "./kyc.service";
import { KycController } from "./kyc.controller";
import { UsersEntity } from "@/entities/user.entity";
import { KycEntity } from "@/entities/kyc.entity";
import { AwsModule } from "@/modules/aws/aws.module";
import { UserMediaKycEntity } from "@/entities/user-media-kyc.entity";
import { UserBusinessDetailsEntity } from "@/entities/user-business.entity";
import { UserKycEntity } from "@/entities/user-kyc.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsersEntity,
      KycEntity,
      UserMediaKycEntity,
      UserBusinessDetailsEntity,
      UserKycEntity,
    ]),
    AwsModule,
  ],
  providers: [KycService],
  controllers: [KycController],
})
export class KycModule {}
