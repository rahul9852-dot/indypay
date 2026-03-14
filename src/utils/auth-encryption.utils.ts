import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";
import { Logger } from "@nestjs/common";
import { appConfig } from "@/config/app.config";

@Injectable()
export class AuthEncryptionService {
  private readonly algorithm = "aes-256-gcm";
  private readonly GCM_IV_LENGTH = 12;
  private readonly GCM_AUTH_TAG_LENGTH = 16;
  // KeyObject is directly in the CipherKey union type — no structural mismatch
  // with TypeScript 5.5's stricter Uint8Array<ArrayBufferLike> vs ArrayBuffer checks.
  private readonly key: crypto.KeyObject;
  private readonly logger = new Logger(AuthEncryptionService.name);

  constructor() {
    const { loginSignupEncryptionKey } = appConfig();

    const keyString = (loginSignupEncryptionKey || "").trim();
    if (!keyString) {
      throw new Error(
        "LOGIN_SIGNUP_ENCRYPTION_KEY environment variable is not set or is empty. Please set it to exactly 32 characters.",
      );
    }
    if (keyString.length !== 32) {
      throw new Error(
        `LOGIN_SIGNUP_ENCRYPTION_KEY must be exactly 32 characters (32 bytes), but got ${keyString.length} characters.`,
      );
    }
    // createSecretKey wraps the raw bytes in a KeyObject — the recommended
    // modern Node.js API for symmetric keys and the only type accepted by
    // all four createCipheriv overloads without TypeScript 5.5 type conflicts.
    this.key = crypto.createSecretKey(keyString, "utf8");
  }

  /**
   * Encrypts data for login/signup endpoints.
   * Output format (base64): [ IV (12 bytes) | authTag (16 bytes) | ciphertext ]
   * @param text - Plain text to encrypt
   * @returns Base64 encoded encrypted string
   */
  encrypt(text: string): string {
    if (!text) {
      throw new Error("Input text must be a non-empty string.");
    }

    try {
      // TypeScript 5.5 made Uint8Array generic. Buffer has ArrayBufferLike
      // backing while crypto APIs expect ArrayBuffer. Uint8Array.from()
      // always allocates a fresh ArrayBuffer — resolving the type mismatch
      // without any unsafe `as any` cast.
      const iv = Uint8Array.from(crypto.randomBytes(this.GCM_IV_LENGTH));
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      const encrypted = Buffer.concat([
        Uint8Array.from(cipher.update(text, "utf8")),
        Uint8Array.from(cipher.final()),
      ]);

      const authTag = Uint8Array.from(cipher.getAuthTag());

      return Buffer.concat([iv, authTag, Uint8Array.from(encrypted)]).toString(
        "base64",
      );
    } catch (error) {
      this.logger.error("Encryption failed");
      throw new Error("Failed to encrypt data");
    }
  }

  /**
   * Decrypts data from login/signup endpoints.
   * Expected input format (base64): [ IV (12 bytes) | authTag (16 bytes) | ciphertext ]
   * @param encryptedText - Base64 encoded encrypted string
   * @returns Decrypted plain text
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) {
      throw new Error("Encrypted text must be a non-empty string.");
    }

    try {
      const raw = Buffer.from(encryptedText, "base64");

      // Slice and immediately convert to Uint8Array<ArrayBuffer> so every
      // subsequent crypto call receives the correct type in TS 5.5.
      const iv = Uint8Array.from(raw.subarray(0, this.GCM_IV_LENGTH));
      const authTag = Uint8Array.from(
        raw.subarray(
          this.GCM_IV_LENGTH,
          this.GCM_IV_LENGTH + this.GCM_AUTH_TAG_LENGTH,
        ),
      );
      const encrypted = Uint8Array.from(
        raw.subarray(this.GCM_IV_LENGTH + this.GCM_AUTH_TAG_LENGTH),
      );

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        Uint8Array.from(decipher.update(encrypted)),
        Uint8Array.from(decipher.final()),
      ]);

      return decrypted.toString("utf8");
    } catch (error) {
      this.logger.error("Decryption failed");
      throw new Error("Failed to decrypt data. Invalid encrypted format.");
    }
  }
}
