import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SNSService } from "./sns.service";
import { S3Service } from "./s3.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [SNSService, S3Service, ConfigService],
  exports: [SNSService, S3Service, ConfigService],
})
export class AwsModule {}
