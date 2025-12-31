const express = require("express")
const { v4: uuidv4 } = require("uuid")
const { z } = require("zod")
const { pool } = require("../config/db")
const { authMiddleware } = require("../middleware/authMiddleware")
const { RtcTokenBuilder, RtcRole } = require("agora-access-token")

const router = express.Router()
router.use(authMiddleware)

const appId = process.env.AGORA_APP_ID
const appCertificate = process.env.AGORA_APP_CERTIFICATE

function ensureAgora(res) {
  if (!appId || !appCertificate) {
    res.status(500).json({ success: false, message: "Agora not configured" })
    return false
  }
  return true
}

async function ensureDoctorLounge(doctorId) {
  const channel = "doctor-lounge"
  console.log(`[DoctorLounge] Ensuring doctor lounge exists for doctor: ${doctorId}`)

  const existing = await pool.query("SELECT * FROM video_calls WHERE channel_name=$1", [channel])
  if (existing.rowCount) {
    console.log(`[DoctorLounge] Doctor lounge already exists:`, { id: existing.rows[0].id, channel })
    return existing.rows[0]
  }

  const id = uuidv4()
  console.log(`[DoctorLounge] Creating new doctor lounge:`, { id, channel })

  const inserted = await pool.query(
    `INSERT INTO video_calls (id, channel_name, type, status, doctor_id, title, scheduled_at, started_at)
     VALUES ($1,$2,'doctor_lounge','live',$3,'Doctor Lounge',NOW(),NOW())
     RETURNING *`,
    [id, channel, doctorId]
  )
  console.log(`[DoctorLounge] Doctor lounge created successfully:`, { id, channel })
  return inserted.rows[0]
}

router.get("/schedule", async (req, res, next) => {
  try {
    const doctorId = req.user.id
    console.log(`[Schedule] Fetching schedule for doctor: ${doctorId}`)

    const appts = await pool.query(
      `SELECT a.*, vc.id as call_id, vc.channel_name, vc.status as call_status, vc.started_at, vc.ended_at
       FROM appointments a
       LEFT JOIN video_calls vc ON vc.appointment_id = a.id
       WHERE a.doctor_id=$1 AND a.status IN ('pending','confirmed') AND a.scheduled_at >= NOW() - interval '1 hour'
       ORDER BY a.scheduled_at ASC`,
      [doctorId]
    )
    console.log(`[Schedule] Found ${appts.rowCount} upcoming appointments`)

    const pastAppts = await pool.query(
      `SELECT a.*, vc.id as call_id, vc.channel_name, vc.status as call_status, vc.started_at, vc.ended_at, vc.duration_seconds
       FROM appointments a
       LEFT JOIN video_calls vc ON vc.appointment_id = a.id
       WHERE a.doctor_id=$1 AND a.status IN ('completed','canceled') AND a.scheduled_at < NOW()
       ORDER BY a.scheduled_at DESC
       LIMIT 50`,
      [doctorId]
    )
    console.log(`[Schedule] Found ${pastAppts.rowCount} past appointments`)

    const lounge = await ensureDoctorLounge(doctorId)
    console.log(`[Schedule] Schedule data prepared successfully`)

    res.json({
      success: true,
      data: {
        upcoming: appts.rows,
        past: pastAppts.rows,
        lounge,
      },
    })
  } catch (err) {
    console.error(`[Schedule] Error fetching schedule:`, err.message)
    next(err)
  }
})

router.post("/instant", async (req, res, next) => {
  try {
    if (!ensureAgora(res)) return
    const doctorId = req.user.id
    const id = uuidv4()
    const channel = `instant-${id.slice(0, 8)}`
    console.log(`[Instant] Creating instant call for doctor: ${doctorId}`, { callId: id, channel })

    const call = await pool.query(
      `INSERT INTO video_calls (id, channel_name, type, status, doctor_id, title, scheduled_at, started_at)
       VALUES ($1,$2,'instant','live',$3,$4,NOW(),NOW()) RETURNING *`,
      [id, channel, doctorId, req.body?.title || "Instant meeting"]
    )
    console.log(`[Instant] Call created successfully:`, { callId: id, channel })
    res.json({ success: true, data: call.rows[0] })
  } catch (err) {
    console.error(`[Instant] Error creating instant call:`, err.message)
    next(err)
  }
})

router.post("/appointment/:id/start", async (req, res, next) => {
  try {
    if (!ensureAgora(res)) return
    const doctorId = req.user.id
    const appt = await pool.query("SELECT * FROM appointments WHERE id=$1 AND doctor_id=$2", [req.params.id, doctorId])
    if (appt.rowCount === 0) return res.status(404).json({ success: false, message: "Appointment not found" })
    const existing = await pool.query("SELECT * FROM video_calls WHERE appointment_id=$1", [req.params.id])
    if (existing.rowCount) {
      const updated = await pool.query(
        "UPDATE video_calls SET status='live', started_at=COALESCE(started_at, NOW()), updated_at=NOW() WHERE id=$1 RETURNING *",
        [existing.rows[0].id]
      )
      return res.json({ success: true, data: updated.rows[0] })
    }
    const id = uuidv4()
    const channel = `appt-${req.params.id.slice(0, 8)}`
    const inserted = await pool.query(
      `INSERT INTO video_calls (id, channel_name, type, status, doctor_id, patient_external_id, appointment_id, title, scheduled_at, started_at)
       VALUES ($1,$2,'appointment','live',$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        id,
        channel,
        doctorId,
        appt.rows[0].patient_external_id,
        appt.rows[0].id,
        req.body?.title || "Appointment",
        appt.rows[0].scheduled_at,
        new Date(),
      ]
    )
    res.json({ success: true, data: inserted.rows[0] })
  } catch (err) {
    next(err)
  }
})

router.post("/:id/token", async (req, res) => {
  if (!ensureAgora(res)) return
  const schema = z.object({
    uid: z.union([z.string(), z.number()]),
    role: z.enum(["publisher", "subscriber"]).default("publisher"),
    expireSeconds: z.number().int().positive().max(86400).default(3600),
  })
  try {
    const callId = req.params.id
    console.log(`[Token] Generating token for call: ${callId}`)

    const body = schema.parse(req.body || {})
    console.log(`[Token] Parsed request body:`, { uid: body.uid, role: body.role, expireSeconds: body.expireSeconds })

    const call = await pool.query("SELECT * FROM video_calls WHERE id=$1", [callId])
    if (call.rowCount === 0) {
      console.warn(`[Token] Call not found: ${callId}`)
      return res.status(404).json({ success: false, message: "Call not found" })
    }

    const channelName = call.rows[0].channel_name
    console.log(`[Token] Channel name: ${channelName}`)

    const role = body.role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER
    const expirationTime = Math.floor(Date.now() / 1000) + body.expireSeconds

    console.log(`[Token] Building token with:`, {
      appId: appId ? "***" : "MISSING",
      appCertificate: appCertificate ? "***" : "MISSING",
      channelName,
      uid: body.uid,
      role: body.role,
      expirationTime,
    })

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      Number(body.uid),
      role,
      expirationTime
    )

    console.log(`[Token] Token generated successfully for call: ${callId}`)
    res.json({ success: true, token, appId, channelName, uid: String(body.uid) })
  } catch (err) {
    console.error(`[Token] Error generating token:`, err.message, err)
    res.status(400).json({ success: false, message: err.message || "Invalid payload" })
  }
})

router.post("/:id/participants/join", async (req, res, next) => {
  try {
    const schema = z.object({
      participantType: z.enum(["doctor", "patient"]),
      participantId: z.string(),
      uid: z.union([z.string(), z.number()]).optional(),
      role: z.string().optional(),
    })
    const body = schema.parse(req.body || {})
    const call = await pool.query("SELECT * FROM video_calls WHERE id=$1", [req.params.id])
    if (call.rowCount === 0) return res.status(404).json({ success: false, message: "Call not found" })
    const participant = await pool.query(
      `INSERT INTO video_call_participants (id, call_id, participant_type, participant_id, uid, role, joined_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())
       ON CONFLICT (call_id, participant_type, participant_id)
       DO UPDATE SET uid=EXCLUDED.uid, role=EXCLUDED.role, joined_at=NOW(), left_at=NULL, duration_seconds=NULL
       RETURNING *`,
      [uuidv4(), req.params.id, body.participantType, body.participantId, body.uid ? String(body.uid) : null, body.role || null]
    )
    res.json({ success: true, data: participant.rows[0] })
  } catch (err) {
    next(err)
  }
})

router.post("/:id/participants/leave", async (req, res, next) => {
  try {
    const schema = z.object({
      participantType: z.enum(["doctor", "patient"]),
      participantId: z.string(),
    })
    const body = schema.parse(req.body || {})
    const updated = await pool.query(
      `UPDATE video_call_participants
       SET left_at=NOW(), duration_seconds = EXTRACT(EPOCH FROM (NOW() - joined_at))::INT
       WHERE call_id=$1 AND participant_type=$2 AND participant_id=$3
       RETURNING *`,
      [req.params.id, body.participantType, body.participantId]
    )
    res.json({ success: true, data: updated.rows[0] || null })
  } catch (err) {
    next(err)
  }
})

router.get("/:id/participants", async (req, res, next) => {
  try {
    const callId = req.params.id
    console.log(`[Participants] Fetching participants for call: ${callId}`)

    const participants = await pool.query(
      `SELECT vcp.*, d.first_name, d.last_name, d.avatar_url, d.email
       FROM video_call_participants vcp
       LEFT JOIN doctors d ON vcp.participant_type = 'doctor' AND vcp.participant_id = d.id
       WHERE vcp.call_id = $1
       ORDER BY vcp.joined_at ASC`,
      [callId]
    )

    const enriched = participants.rows.map((p) => ({
      id: p.id,
      call_id: p.call_id,
      participant_type: p.participant_type,
      participant_id: p.participant_id,
      uid: p.uid,
      role: p.role,
      joined_at: p.joined_at,
      left_at: p.left_at,
      duration_seconds: p.duration_seconds,
      display_name: p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.participant_id,
      avatar_url: p.avatar_url,
      email: p.email,
    }))

    console.log(`[Participants] Found ${enriched.length} participants`)
    res.json({ success: true, data: enriched })
  } catch (err) {
    console.error(`[Participants] Error fetching participants:`, err.message)
    next(err)
  }
})

router.post("/:id/end", async (req, res, next) => {
  try {
    const schema = z.object({
      durationSeconds: z.number().int().optional(),
    })
    const body = schema.parse(req.body || {})
    const call = await pool.query("SELECT * FROM video_calls WHERE id=$1", [req.params.id])
    if (call.rowCount === 0) return res.status(404).json({ success: false, message: "Call not found" })
    const startedAt = call.rows[0].started_at || new Date()
    const duration =
      body.durationSeconds ||
      Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
    const updated = await pool.query(
      `UPDATE video_calls
       SET status='ended', ended_at=NOW(), duration_seconds=$2, updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [req.params.id, duration]
    )
    res.json({ success: true, data: updated.rows[0] })
  } catch (err) {
    next(err)
  }
})

module.exports = router
