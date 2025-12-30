const express = require("express")
const { RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole } = require("agora-access-token")
const { z } = require("zod")

const router = express.Router()

const appId = process.env.AGORA_APP_ID
const appCertificate = process.env.AGORA_APP_CERTIFICATE

function ensureConfig(res) {
  if (!appId || !appCertificate) {
    res.status(500).json({ success: false, message: "Agora is not configured" })
    return false
  }
  return true
}

router.post("/rtc-token", async (req, res) => {
  if (!ensureConfig(res)) return
  const schema = z.object({
    channelName: z.string().min(1),
    uid: z.union([z.string(), z.number()]),
    role: z.enum(["publisher", "subscriber"]).default("publisher"),
    expireSeconds: z.number().int().positive().max(86400).default(3600),
  })
  try {
    const body = schema.parse(req.body || {})
    const role = body.role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      body.channelName,
      Number(body.uid),
      role,
      Math.floor(Date.now() / 1000) + body.expireSeconds
    )
    res.json({ success: true, token, appId, channelName: body.channelName, uid: String(body.uid), role: body.role })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || "Invalid payload" })
  }
})

router.post("/rtm-token", async (req, res) => {
  if (!ensureConfig(res)) return
  const schema = z.object({
    account: z.string().min(1),
    expireSeconds: z.number().int().positive().max(86400).default(3600),
  })
  try {
    const body = schema.parse(req.body || {})
    const token = RtmTokenBuilder.buildToken(
      appId,
      appCertificate,
      body.account,
      RtmRole.Rtm_User,
      Math.floor(Date.now() / 1000) + body.expireSeconds
    )
    res.json({ success: true, token, appId, account: body.account })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || "Invalid payload" })
  }
})

module.exports = router
