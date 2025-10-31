import CryptoJS from "crypto-js"

// In production, this should be an environment variable
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "git-sync-manager-default-key-change-in-production"

export function encrypt(text: string): string {
  try {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString()
  } catch (error) {
    console.error("Encryption error:", error)
    throw new Error("Failed to encrypt data")
  }
}

export function decrypt(encryptedText: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    console.error("Decryption error:", error)
    throw new Error("Failed to decrypt data")
  }
}

export function encryptCredential(credential: { username: string; token: string; url?: string }) {
  return {
    username: encrypt(credential.username),
    token: encrypt(credential.token),
    url: credential.url ? encrypt(credential.url) : undefined,
  }
}

export function decryptCredential(credential: { username: string; token: string; url?: string }) {
  return {
    username: decrypt(credential.username),
    token: decrypt(credential.token),
    url: credential.url ? decrypt(credential.url) : undefined,
  }
}
