import {
  createCipheriv,
  createDecipheriv,
  createSecretKey,
  randomBytes,
  scrypt,
  CipherGCM,
  DecipherGCM,
} from "crypto";
import { promisify } from "util";
import { appConfig } from "@/config/app.config";

const { encryptionKey } = appConfig();

// S-4 fix: migrated from AES-256-CTR (no integrity) to AES-256-GCM (AEAD).
// GCM produces a 16-byte authentication tag that detects any ciphertext tampering,
// preventing the bit-flipping attacks that CTR is vulnerable to.
const GCM_ALG = "aes-256-gcm";
const GCM_IV_LENGTH = 12; // 96-bit IV — optimal for GCM performance and security
const GCM_TAG_LENGTH = 16; // 128-bit authentication tag (maximum strength)
const GCM_IV_HEX = GCM_IV_LENGTH * 2; // 24 hex chars
const GCM_TAG_HEX = GCM_TAG_LENGTH * 2; // 32 hex chars

// Legacy constants kept only for decrypting existing CTR-encrypted DB records.
const LEGACY_ALG = "aes-256-ctr";
const LEGACY_IV_HEX = 32; // 16-byte IV stored as 32 hex chars

// Version prefix that distinguishes new GCM ciphertext from legacy CTR ciphertext.
const V2_PREFIX = "v2:";

/** Derives the 256-bit key via scrypt. Same KDF as before — keeps existing data decryptable. */
const deriveKey = async (): Promise<Buffer> => {
  return (await promisify(scrypt)(encryptionKey, "salt", 32)) as Buffer;
};

/**
 * Encrypts data with AES-256-GCM (authenticated encryption).
 *
 * Output format: "v2:" + iv_hex(24) + authTag_hex(32) + ciphertext_hex
 */
export const encryptData = async (data: string): Promise<string> => {
  const key = await deriveKey();
  const iv = Uint8Array.from(randomBytes(GCM_IV_LENGTH));
  const keyObj = createSecretKey(Uint8Array.from(key));

  const cipher = createCipheriv(GCM_ALG, keyObj, iv, {
    authTagLength: GCM_TAG_LENGTH,
  }) as CipherGCM;

  const encrypted = Buffer.concat([
    Uint8Array.from(cipher.update(data, "utf8")),
    Uint8Array.from(cipher.final()),
  ]);
  const authTag = cipher.getAuthTag();

  return (
    V2_PREFIX +
    Buffer.from(iv).toString("hex") +
    authTag.toString("hex") +
    encrypted.toString("hex")
  );
};

/**
 * Decrypts data. Handles both formats transparently:
 *   - v2 prefix  → new AES-256-GCM path (authentication tag is verified)
 *   - no prefix  → legacy AES-256-CTR path (backward compat for existing DB records)
 */
export const decryptData = async (data: string): Promise<string> => {
  const key = await deriveKey();

  if (data.startsWith(V2_PREFIX)) {
    // ── New AES-256-GCM path ────────────────────────────────────────────────
    const payload = data.slice(V2_PREFIX.length);
    const iv = Uint8Array.from(
      Buffer.from(payload.slice(0, GCM_IV_HEX), "hex"),
    );
    const authTag = Uint8Array.from(
      Buffer.from(payload.slice(GCM_IV_HEX, GCM_IV_HEX + GCM_TAG_HEX), "hex"),
    );
    const encryptedText = Uint8Array.from(
      Buffer.from(payload.slice(GCM_IV_HEX + GCM_TAG_HEX), "hex"),
    );

    const keyObj = createSecretKey(Uint8Array.from(key));
    const decipher = createDecipheriv(GCM_ALG, keyObj, iv, {
      authTagLength: GCM_TAG_LENGTH,
    }) as DecipherGCM;
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      Uint8Array.from(decipher.update(encryptedText)),
      Uint8Array.from(decipher.final()),
    ]).toString("utf-8");
  } else {
    // ── Legacy AES-256-CTR path — backward compat for existing DB records ───
    const iv = Uint8Array.from(
      Buffer.from(data.slice(0, LEGACY_IV_HEX), "hex"),
    );
    const encryptedText = Uint8Array.from(
      Buffer.from(data.slice(LEGACY_IV_HEX), "hex"),
    );
    const decipher = createDecipheriv(LEGACY_ALG, Uint8Array.from(key), iv);

    return Buffer.concat([
      Uint8Array.from(decipher.update(encryptedText)),
      Uint8Array.from(decipher.final()),
    ]).toString("utf-8");
  }
};
