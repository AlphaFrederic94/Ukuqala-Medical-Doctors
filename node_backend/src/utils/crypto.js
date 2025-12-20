const crypto = require("crypto")

const keyHex = (process.env.ENCRYPTION_KEY || "").trim()
if (!keyHex || keyHex.length !== 32) {
  throw new Error("ENCRYPTION_KEY missing or not 32 characters (expected 32-byte hex-like string)")
}
const key = Buffer.from(keyHex, "utf8")

function encryptPayload(obj) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
  const plaintext = Buffer.from(JSON.stringify(obj), "utf8")
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const authTag = cipher.getAuthTag()
  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: authTag.toString("base64"),
  }
}

function decryptPayload(payload) {
  if (!payload?.ciphertext || !payload?.iv || !payload?.tag) return null
  const iv = Buffer.from(payload.iv, "base64")
  const tag = Buffer.from(payload.tag, "base64")
  const ciphertext = Buffer.from(payload.ciphertext, "base64")
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return JSON.parse(decrypted.toString("utf8"))
}

module.exports = { encryptPayload, decryptPayload }
