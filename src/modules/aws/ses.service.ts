import { Injectable } from "@nestjs/common";
import {
  SendEmailCommand,
  SendEmailCommandInput,
  SendRawEmailCommand,
  SendRawEmailCommandInput,
  SES,
} from "@aws-sdk/client-ses";
import { appConfig } from "@/config/app.config";
import { CustomLogger, LoggerPlaceHolder } from "@/logger";

const {
  aws: { accessKeyId, secretAccessKey },
  emailConfig: { from, sesRegion },
} = appConfig();

@Injectable()
export class SESService {
  private ses: SES;
  private readonly logger = new CustomLogger(SESService.name);

  constructor() {
    this.ses = new SES({
      region: sesRegion,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.logger.info(`SES Service initialized with region: ${sesRegion}`);
  }

  async sendEmail(
    subject: string,
    body: string,
    email: string,
    attachment?: {
      filename: string;
      data: Buffer;
      contentType: string;
    },
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (attachment) {
        // Use SendRawEmailCommand for emails with attachments
        const boundary = "boundary_" + Math.random().toString(36).substring(2);
        const mimeBody = [
          "From: " + from,
          "To: " + email,
          "Subject: " + subject,
          "MIME-Version: 1.0",
          `Content-Type: multipart/mixed; boundary="${boundary}"`,
          "",
          `--${boundary}`,
          "Content-Type: text/html; charset=utf-8",
          "",
          body,
          `--${boundary}`,
          `Content-Type: ${attachment.contentType}`,
          "Content-Transfer-Encoding: base64",
          `Content-Disposition: attachment; filename="${attachment.filename}"`,
          "",
          attachment.data.toString("base64"),
          `--${boundary}--`,
        ].join("\r\n");

        const rawParams: SendRawEmailCommandInput = {
          RawMessage: {
            Data: new Uint8Array(Buffer.from(mimeBody)),
          },
          Source: from,
          Destinations: [email],
        };

        const command = new SendRawEmailCommand(rawParams);
        const result = await this.ses.send(command);

        this.logger.info(
          `Email with attachment sent successfully. Result: ${LoggerPlaceHolder.Json}`,
          {
            messageId: result.MessageId,
          },
        );
      } else {
        // Use SendEmailCommand for emails without attachments
        const params: SendEmailCommandInput = {
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

        const command = new SendEmailCommand(params);
        const result = await this.ses.send(command);

        this.logger.info(
          `Email sent successfully. Result: ${LoggerPlaceHolder.Json}`,
          {
            messageId: result.MessageId,
          },
        );
      }

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
