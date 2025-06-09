import { createCipheriv, createDecipheriv, randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { appConfig } from "@/config/app.config";

const alg = "aes-256-ctr";
const { encryptionIV, authKey, encryptionAlgorithm, encryptionKey } =
  appConfig();

export const encryptData = async (data: string) => {
  const iv = randomBytes(16); // IV should be random for each encryption
  const key = (await promisify(scrypt)(encryptionKey, "salt", 32)) as Buffer;
  const cipher = createCipheriv(alg, key, iv);

  const encryptedText = Buffer.concat([cipher.update(data), cipher.final()]);

  // Return both IV and encrypted data as hex, concatenating them
  return iv.toString("hex") + encryptedText.toString("hex");
};

export const decryptData = async (data: string) => {
  const iv = Buffer.from(data.slice(0, 32), "hex"); // Extract the IV from the data
  const encryptedText = Buffer.from(data.slice(32), "hex"); // Extract the actual encrypted data
  const key = (await promisify(scrypt)(encryptionKey, "salt", 32)) as Buffer;
  const decipher = createDecipheriv(alg, key, iv);

  const decryptedText = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]);

  return decryptedText.toString("utf-8");
};

export function encrypt(text: string) {
  // console.log("text log::=======>", text);
  const cipher = createCipheriv(
    encryptionAlgorithm,
    Buffer.from(authKey),
    encryptionIV,
  );

  // console.log("cipher log::", cipher);
  const encrypted = cipher.update(text);
  const finalEncrypted = Buffer.concat([encrypted, cipher.final()]);

  return finalEncrypted.toString("base64");
}

// decrypt function
export function decrypt(text: string) {
  const decipher = createDecipheriv(
    encryptionAlgorithm,
    Buffer.from(authKey),
    encryptionIV,
  );
  const decrypted = decipher.update(Buffer.from(text, "base64"));
  const finalDecrypted = Buffer.concat([decrypted, decipher.final()]);

  return finalDecrypted.toString("utf8");
}
