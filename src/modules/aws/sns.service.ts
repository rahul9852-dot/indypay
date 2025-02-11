import { Injectable } from "@nestjs/common";
import { SNS } from "@aws-sdk/client-sns";
import { appConfig } from "@/config/app.config";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";

const {
  aws: { accessKeyId, secretAccessKey, region },
} = appConfig();
@Injectable()
export class SNSService {
  private sns: SNS;
  private readonly logger = new CustomLogger(SNSService.name);
  constructor() {
    this.sns = new SNS([
      {
        accessKeyId,
        secretAccessKey,
        region,
      },
    ]);
    // Log SNS configuration on startup (excluding sensitive data)
    this.logger.info(`SNS Service initialized with region: ${region}`);
  }
  async sendSMS(
    phoneNumber: string,
    message: string,
    isProduction = false,
  ): Promise<{ success: boolean; message: string }> {
    if (!isProduction) {
      return {
        success: true,
        message: "SMS sent successfully",
      };
    }
    try {
      const formattedNumber = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+${phoneNumber}`;
      this.logger.info(
        `Preparing to send SMS to ${formattedNumber} with config: ${LoggerPlaceHolder.Json}`,
        { region, messageLength: message.length },
      );
      const params = {
        Message: message,
        PhoneNumber: formattedNumber,
        MessageAttributes: {
          "AWS.SNS.SMS.SMSType": {
            DataType: "String",
            StringValue: "Transactional",
          },
          "AWS.SNS.SMS.SenderID": {
            DataType: "String",
            StringValue: "PayBolt", // Your sender ID
          },
        },
      };
      this.logger.info(`Sending SMS with params: ${LoggerPlaceHolder.Json}`, {
        phoneNumber: formattedNumber,
        messageType: "Transactional",
      });
      const result = await this.sns.publish(params);
      this.logger.info(
        `SMS sent successfully. Result: ${LoggerPlaceHolder.Json}`,
        { messageId: result.MessageId, requestId: result.$metadata.requestId },
      );

      return {
        success: true,
        message: "SMS sent successfully",
      };
    } catch (error) {
      this.logger.error(
        `Failed to send SMS to ${phoneNumber}. Error: ${LoggerPlaceHolder.Json}`,
        {
          errorCode: error.code,
          errorMessage: error.message,
          requestId: error.$response?.requestId,
          statusCode: error.$response?.httpResponse?.statusCode,
        },
      );

      return {
        success: false,
        message: `Failed to send SMS: ${error.message}`,
      };
    }
  }
}
