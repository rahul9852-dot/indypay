// src/crypto/crypto.service.ts
import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";
import { Logger } from "@nestjs/common";
import { appConfig } from "@/config/app.config";

const {
  utkarsh: { utkarshAuthKey, utkarshAuthIV },
} = appConfig();
@Injectable()
export class UtkarshCryptoService {
  private algorithm = "aes-256-cbc";
  private authKey = utkarshAuthKey;
  private authIV = utkarshAuthIV;
  private logger = new Logger(UtkarshCryptoService.name);

  constructor() {
    this.logger.debug(`Utkarsh auth key: ${this.authKey}`);
    this.logger.debug(`Utkarsh auth IV: ${this.authIV}`);
    this.logger.debug(`Utkarsh algorithm: ${this.algorithm}`);
  }

  encrypt(text: string): string {
    this.logger.debug(
      `Utkarsh auth key length: ${Buffer.from(this.authKey, "base64").length}`,
    );
    this.logger.debug(
      `Utkarsh auth IV length: ${Buffer.from(this.authIV, "base64").length}`,
    );

    const key = Buffer.from(this.authKey, "base64");
    const iv = Buffer.from(this.authIV, "base64");
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(text, "utf8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return encrypted.toString("hex").toUpperCase();
  }

  decrypt(text: string): string {
    try {
      const key = Buffer.from(this.authKey, "base64");
      const iv = Buffer.from(this.authIV, "base64");
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);

      let decrypted = decipher.update(Buffer.from(text, "hex"));
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString("utf8");
    } catch (error) {
      this.logger.error("Decryption error:", error.message);
      throw error;
    }
  }
}
