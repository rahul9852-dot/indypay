import { Module } from "@nestjs/common";
import { SNSService } from "./sns.service";
import { S3Service } from "./s3.service";
import { SESService } from "./ses.service";

@Module({
  providers: [SNSService, S3Service, SESService],
  exports: [SNSService, S3Service, SESService],
})
export class AwsModule {}
