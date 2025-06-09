// src/crypto/crypto.service.ts
import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";
import { Logger } from "@nestjs/common";

@Injectable()
export class CryptoService {
  private algorithm = "aes-128-cbc";
  private authKey = "XcOu75XCz7aTQf51";
  private authIV = "zDSbtVze14US2iQR";
  private logger = new Logger(CryptoService.name);

  encrypt(text: string): string {
    const cipher = crypto.createCipheriv(
      this.algorithm,
      Buffer.from(this.authKey),
      this.authIV,
    );
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return encrypted.toString("base64");
  }

  decrypt(text: string): string {
    try {
      this.logger.debug("Attempting to decrypt text of length:", text.length);
      this.logger.debug(
        "First 10 characters of encrypted text:",
        text.substring(0, 10),
      );

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        Buffer.from(this.authKey),
        this.authIV,
      );

      let decrypted = decipher.update(Buffer.from(text, "base64"));
      this.logger.debug(
        "After first update, decrypted length:",
        decrypted.length,
      );

      decrypted = Buffer.concat([decrypted, decipher.final()]);
      this.logger.debug("After final, decrypted length:", decrypted.length);

      return decrypted.toString("utf8");
    } catch (error) {
      this.logger.error("Decryption error:", error);
      this.logger.error("Error stack:", error.stack);
      throw error;
    }
  }
}
