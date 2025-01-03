import { Module } from "@nestjs/common";
import { SNSService } from "./sns.service";
import { S3Service } from "./s3.service";

@Module({
  providers: [SNSService, S3Service],
  exports: [SNSService, S3Service],
})
export class AwsModule {}
