// src/crypto/crypto.service.ts
import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";

@Injectable()
export class CryptoService {
  private algorithm = "aes-128-cbc";
  private authKey = "XcOu75XCz7aTQf51";
  private authIV = "zDSbtVze14US2iQR";

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
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(this.authKey),
      this.authIV,
    );
    let decrypted = decipher.update(Buffer.from(text, "base64"));
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf8");
  }
}
