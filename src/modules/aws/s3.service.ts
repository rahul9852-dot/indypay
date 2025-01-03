import { Injectable } from "@nestjs/common";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>("AWS_REGION"),
      credentials: {
        accessKeyId: this.configService.get<string>("AWS_ACCESS_KEY_ID"),
        secretAccessKey: this.configService.get<string>(
          "AWS_SECRET_ACCESS_KEY",
        ),
      },
    });
    this.bucketName = this.configService.get<string>("AWS_S3_BUCKET_NAME");
  }

  async generatePresignedUrl(
    fileName: string,
    fileType: string,
    folder = "kyc",
  ): Promise<{ presignedUrl: string; key: string }> {
    const key = `${folder}/${Date.now()}-${fileName}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: fileType,
    });

    const presignedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    });

    return { presignedUrl, key };
  }

  getFileUrl(key: string): string {
    return `https://${this.bucketName}.s3.${this.configService.get<string>(
      "AWS_REGION",
    )}.amazonaws.com/${key}`;
  }
}
