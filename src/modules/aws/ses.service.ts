import { Injectable } from "@nestjs/common";
import { SES } from "@aws-sdk/client-ses";
import { appConfig } from "@/config/app.config";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";

const {
  aws: { accessKeyId, secretAccessKey, region },
  emailConfig: { from },
} = appConfig();

@Injectable()
export class SESService {
  private ses: SES;
  private readonly logger = new CustomLogger(SESService.name);

  constructor() {
    this.ses = new SES({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.logger.info(`SES Service initialized with region: ${region}`);
  }

  async sendEmailOtp(
    email: string,
    otp: string,
    name?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const subject = `Let's verify your email with PayBolt!`;
      const body = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
              <div style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px;">
                PayBolt
              </div>
              <h2 style="color: #4CAF50; text-align: center;">Hey there,</h2>
              <p style="text-align: center;">Great to see you aboard! Let's quickly verify your email to get you started. Your verification code is:</p>
              <h3 style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; text-align: center;">${otp}</h3>
              <p style="text-align: center;">Remember, this code is valid only for the next 10 minutes. We can't wait for you to explore all the amazing features we have to offer!</p>
              <p style="text-align: center; margin-top: 30px;">Regards,<br>Paybolt Support</p>
            </div>
          </body>
        </html>
      `;

      const params = {
        Destination: {
          ToAddresses: [email],
        },
        Message: {
          Body: {
            Html: {
              Data: body,
            },
          },
          Subject: {
            Data: subject,
          },
        },
        Source: from,
      };

      this.logger.info(`Sending email to ${email} with OTP: ${otp}`);
      const result = await this.ses.sendEmail(params);
      this.logger.info(
        `Email sent successfully. Result: ${LoggerPlaceHolder.Json}`,
        {
          messageId: result.MessageId,
        },
      );

      return {
        success: true,
        message: "Email sent successfully",
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${email}. Error: ${LoggerPlaceHolder.Json}`,
        {
          errorCode: error.code,
          errorMessage: error.message,
        },
      );

      return {
        success: false,
        message: `Failed to send email: ${error.message}`,
      };
    }
  }
}
