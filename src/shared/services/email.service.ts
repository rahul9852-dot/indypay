import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { CustomLogger } from "@/logger";
import { appConfig } from "@/config/app.config";

const {
  emailConfig: { host, port, username, password, from },
} = appConfig();

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new CustomLogger(EmailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // For port 587, always use false
      requireTLS: true, // Force TLS
      auth: {
        user: username,
        pass: password,
      },
      tls: {
        minVersion: "TLSv1.2",
      },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: any[],
  ) {
    if (!to || !subject || !html) {
      throw new Error(
        "Required parameters missing. sendEmail requires: to, subject, and html content",
      );
    }
    try {
      // Log SMTP configuration for debugging (excluding sensitive data)
      // this.logger.debug('SMTP Configuration:', {
      //   host: process.env.SMTP_HOST,
      //   port: process.env.SMTP_PORT,
      //   user: process.env.SMTP_USER,
      //   from: process.env.SMTP_FROM
      // });

      const mailOptions = {
        from,
        to,
        subject,
        html,
        attachments,
      };

      // Verify connection configuration
      await this.transporter.verify().catch((err: any) => {
        this.logger.error("SMTP Connection verification failed:", err);
        throw err;
      });

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.info(`Email sent successfully to ${to}`, {
        messageId: result.messageId,
      });

      return result;
    } catch (error) {
      this.logger.error("Error sending email", error);
      throw error;
    }
  }
}
