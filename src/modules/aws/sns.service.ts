import { Injectable } from "@nestjs/common";
import { SNS } from "aws-sdk";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SNSService {
  private sns: SNS;

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get("AWS_ACCESS_KEY_ID");
    const secretAccessKey = this.configService.get("AWS_SECRET_ACCESS_KEY");
    const region = this.configService.get("AWS_REGION");

    this.sns = new SNS({
      accessKeyId,
      secretAccessKey,
      region,
    });
  }

  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const params = {
        Message: message,
        PhoneNumber: phoneNumber.startsWith("+")
          ? phoneNumber
          : `+${phoneNumber}`,
      };

      const result = await this.sns.publish(params).promise();

      return true;
    } catch (error) {
      return false;
    }
  }

  async verifyPhoneForSandbox(
    phoneNumber: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const formattedNumber = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+${phoneNumber}`;

      // First check if the number is already verified
      const verifiedNumbers = await this.listVerifiedPhones();
      if (verifiedNumbers.includes(formattedNumber)) {
        return {
          success: true,
          message: "Phone number is already verified",
        };
      }

      // Create sandbox phone number
      await this.sns
        .createSMSSandboxPhoneNumber({
          PhoneNumber: formattedNumber,
          LanguageCode: "en-US",
        })
        .promise();

      return {
        success: true,
        message: "Verification code sent to phone number",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to verify phone number",
      };
    }
  }

  async confirmPhoneVerification(
    phoneNumber: string,
    otp: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const formattedNumber = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+${phoneNumber}`;

      await this.sns
        .verifySMSSandboxPhoneNumber({
          PhoneNumber: formattedNumber,
          OneTimePassword: otp,
        })
        .promise();

      return {
        success: true,
        message: "Phone number verified successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to confirm verification",
      };
    }
  }

  async listVerifiedPhones(): Promise<string[]> {
    try {
      const verifiedNumbers: string[] = [];
      let nextToken: string | undefined;

      do {
        const response = await this.sns
          .listSMSSandboxPhoneNumbers({
            NextToken: nextToken,
          })
          .promise();

        response.PhoneNumbers?.forEach((phone) => {
          if (phone.Status === "Verified" && phone.PhoneNumber) {
            verifiedNumbers.push(phone.PhoneNumber);
          }
        });

        nextToken = response.NextToken;
      } while (nextToken);

      return verifiedNumbers;
    } catch (error) {
      return [];
    }
  }

  async isPhoneVerifiedInSandbox(phoneNumber: string): Promise<boolean> {
    const formattedNumber = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+${phoneNumber}`;
    const verifiedNumbers = await this.listVerifiedPhones();

    return verifiedNumbers.includes(formattedNumber);
  }

  // async sendEmail(email: string, message: string): Promise<boolean> {
  //   try {
  //     // Note: For email, you might want to use Amazon SES instead
  //     // This is just a placeholder for now
  //     await this.sns
  //       .publish({
  //         Message: message,
  //         TopicArn: this.configService.get("AWS_SNS_EMAIL_TOPIC_ARN"),
  //       })
  //       .promise();
  //     return true;
  //   } catch (error) {
  //     console.error("Error sending email:", error);
  //     return false;
  //   }
  // }
}
