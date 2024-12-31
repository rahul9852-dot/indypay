import { BadRequestException } from "@nestjs/common";
import * as crypto from "crypto";

export interface ISignatureData {
  amount: string;
  name: string;
  mobile: string;
  txnCurr: string;
  email: string;
  key_id: string;
  key_secret: string;
}

export interface IEncryptData extends ISignatureData {
  signature: string;
}

export interface IDencryptData {
  amount: number;
  upiIntent: string;
  orderId: string;
  signature: string;
  name: string;
  mobile: string;
  description: string;
  txnCurr: string;
  email: string;
  transactionId: string;
  status: string;
  statusCode: string;
}

export const generateSignature = (data: ISignatureData) => {
  const values =
    data.key_id +
    data.key_secret +
    data.txnCurr +
    data.amount +
    data.name +
    data.email +
    data.mobile;

  // Creating HMAC signature
  const message = Buffer.from(values, "utf-8");
  const secret = Buffer.from(data.key_secret, "utf-8");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");

  return signature;
};

export const encryptPayNPro = (
  data: IEncryptData,
  salt: string,
  aesSecretKey: string,
) => {
  const dataStr = JSON.stringify({
    amount: data.amount,
    name: data.name,
    mobile: data.mobile,
    txnCurr: data.txnCurr,
    email: data.email,
    key_id: data.key_id,
    key_secret: data.key_secret,
    signature: data.signature,
  });

  if (aesSecretKey != null && dataStr !== "" && salt !== "") {
    const method = "aes-256-cbc";

    // Converting Array to bytes
    const iv = Buffer.from([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]);

    // Encoding to UTF-8
    const salt1 = Buffer.from(salt, "utf8");
    const key1 = Buffer.from(aesSecretKey, "utf8");

    // SecretKeyFactory Instance of PBKDF2WithHmacSHA1 Java Equivalent
    const hash = crypto.pbkdf2Sync(key1, salt1, 65536, 32, "sha1");

    const cipher = crypto.createCipheriv(method, hash, iv);
    let encrypted = cipher.update(dataStr, "utf8", "hex");
    encrypted += cipher.final("hex");

    return encrypted;
  } else {
    throw new BadRequestException(
      "String to encrypt, Salt and Key is required.",
    );
  }
};

export const decryptPayNPro = (
  data: string,
  encryptionSalt: string,
  aesSecretKey: string,
): IDencryptData => {
  if (data !== "" && encryptionSalt !== "" && aesSecretKey != null) {
    const method = "aes-256-cbc";

    // Converting Array to bytes
    const iv = Buffer.from([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]);

    // Encoding to UTF-8
    const salt1 = Buffer.from(encryptionSalt, "utf8");
    const key1 = Buffer.from(aesSecretKey, "utf8");

    // SecretKeyFactory Instance of PBKDF2WithHmacSHA1 Java Equivalent
    const hash = crypto.pbkdf2Sync(key1, salt1, 65536, 32, "sha1");

    const decipher = crypto.createDecipheriv(method, hash, iv);
    let decrypted = decipher.update(data, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);
  } else {
    throw new BadRequestException(
      "Encrypted String to decrypt, Salt and Key is required.",
    );
  }
};
