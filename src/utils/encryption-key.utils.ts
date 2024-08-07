import crypto from "crypto";
import fs from "fs";
import path from "path";

// Function to generate RSA key pair
const generateRSAKeyPair = (
  privateKeyPath: string,
  publicKeyPath: string,
  keySize = 2048,
) => {
  // Generate a new RSA key pair
  crypto.generateKeyPair(
    "rsa",
    {
      modulusLength: keySize, // Key size in bits
      publicKeyEncoding: {
        type: "spki", // Recommended format for public key
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8", // Recommended format for private key
        format: "pem",
        cipher: "aes-256-cbc",
        passphrase: "your-secure-passphrase", // Optional passphrase for extra security
      },
    },
    (err, publicKey, privateKey) => {
      if (err) {
        return;
      }

      // Write the public key to a file
      fs.writeFileSync(publicKeyPath, publicKey);

      // Write the private key to a file
      fs.writeFileSync(privateKeyPath, privateKey);
    },
  );
};

// Define file paths for the keys
const privateKeyPath = path.join(__dirname, "private-key.pem");
const publicKeyPath = path.join(__dirname, "public-key.pem");

// Renew the keys
export const renewRSAKeyPair = () =>
  generateRSAKeyPair(privateKeyPath, publicKeyPath);
