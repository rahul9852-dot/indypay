import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";
import { Logger } from "@nestjs/common";
import { appConfig } from "@/config/app.config";

@Injectable()
export class AuthEncryptionService {
  private readonly algorithm = "aes-256-cbc";
  private readonly key: Buffer;
  private readonly iv: Buffer;
  private readonly logger = new Logger(AuthEncryptionService.name);

  constructor() {
    const { loginSignupEncryptionKey, loginSignupEncryptionIV } = appConfig();

    // Trim whitespace and ensure key is exactly 32 bytes (256 bits) for AES-256
    const keyString = (loginSignupEncryptionKey || "").trim();
    if (!keyString) {
      throw new Error(
        "LOGIN_SIGNUP_ENCRYPTION_KEY environment variable is not set or is empty. Please set it to exactly 32 characters.",
      );
    }
    if (keyString.length !== 32) {
      throw new Error(
        `LOGIN_SIGNUP_ENCRYPTION_KEY must be exactly 32 characters (32 bytes), but got ${keyString.length} characters. Current value length: ${keyString.length}`,
      );
    }
    this.key = Buffer.from(keyString, "utf8");

    // Trim whitespace and ensure IV is exactly 16 bytes for AES
    const ivString = (loginSignupEncryptionIV || "").trim();
    if (!ivString) {
      throw new Error(
        "LOGIN_SIGNUP_ENCRYPTION_IV environment variable is not set or is empty. Please set it to exactly 16 characters.",
      );
    }
    if (ivString.length !== 16) {
      throw new Error(
        `LOGIN_SIGNUP_ENCRYPTION_IV must be exactly 16 characters (16 bytes), but got ${ivString.length} characters. Current value length: ${ivString.length}`,
      );
    }
    this.iv = Buffer.from(ivString, "utf8");
  }

  /**
   * Encrypts data for login/signup endpoints
   * @param text - Plain text to encrypt
   * @returns Base64 encoded encrypted string
   */
  encrypt(text: string): string {
    try {
      const cipher = crypto.createCipheriv(
        this.algorithm,
        this.key as any,
        this.iv as any,
      );
      let encrypted = cipher.update(text, "utf8");
      encrypted = Buffer.concat([encrypted, cipher.final()] as any);

      return encrypted.toString("base64");
    } catch (error) {
      this.logger.error("Encryption error:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  /**
   * Decrypts data from login/signup endpoints
   * @param encryptedText - Base64 encoded encrypted string
   * @returns Decrypted plain text
   */
  decrypt(encryptedText: string): string {
    try {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.key as any,
        this.iv as any,
      );
      let decrypted = decipher.update(
        Buffer.from(encryptedText, "base64") as any,
      );
      decrypted = Buffer.concat([decrypted, decipher.final()] as any);

      return decrypted.toString("utf8");
    } catch (error) {
      this.logger.error("Decryption error:", error);
      throw new Error("Failed to decrypt data. Invalid encrypted format.");
    }
  }
}
