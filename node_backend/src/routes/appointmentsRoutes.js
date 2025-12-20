const express = require("express")
const { v4: uuidv4 } = require("uuid")
const { z } = require("zod")
const { pool } = require("../config/db")
const { appointmentAuth } = require("../middleware/appointmentAuth")
const { supabase } = require("../config/supabase")

const router = express.Router()

const appointmentCreateSchema = z.object({
  doctorId: z.string().uuid(),
  patientExternalId: z.string().uuid().optional(),
  scheduledAt: z.string(),
  durationMinutes: z.number().int().positive(),
  type: z.enum(["physical", "virtual", "follow-up"]),
  location: z.string().optional(),
  meetingUrl: z.string().optional(),
  reason: z.string().optional(),
  attachments: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
})

const appointmentStatusSchema = z.object({
  status: z.enum(["confirmed", "rescheduled", "canceled", "completed"]),
  scheduledAt: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  meetingUrl: z.string().optional(),
  reason: z.string().optional(),
})

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Create an appointment (patient)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               doctorId: { type: string, format: uuid }
 *               patientExternalId: { type: string, format: uuid, description: "Required only if called with a doctor token; for patients this is inferred from token" }
 *               scheduledAt: { type: string, format: date-time }
 *               durationMinutes: { type: integer }
 *               type: { type: string, enum: ["physical","virtual","follow-up"] }
 *               location: { type: string }
 *               meetingUrl: { type: string }
 *               reason: { type: string }
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name: { type: string }
 *                     url: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/", appointmentAuth, async (req, res, next) => {
  try {
    const body = appointmentCreateSchema.parse(req.body)
    // enforce actor: patient or doctor
    if (req.actor.type === "patient") {
      body.patientExternalId = req.actor.patientExternalId
    } else if (!body.patientExternalId) {
      return res.status(400).json({ success: false, message: "patientExternalId required" })
    }

    const id = uuidv4()
    const insert = `
      INSERT INTO appointments (
        id, doctor_id, patient_external_id, scheduled_at, duration_minutes, type, status, location, meeting_url, reason, attachments
      ) VALUES ($1,$2,$3,$4,$5,$6,'pending',$7,$8,$9,$10::jsonb)
      RETURNING *
    `
    const values = [
      id,
      body.doctorId,
      body.patientExternalId,
      body.scheduledAt,
      body.durationMinutes,
      body.type,
      body.location || null,
      body.meetingUrl || null,
      body.reason || null,
      JSON.stringify(body.attachments || []),
    ]
    const result = await pool.query(insert, values)
    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /appointments:
 *   get:
 *     summary: List appointments (doctor or patient)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List
 */
router.get("/", appointmentAuth, async (req, res, next) => {
  try {
    const { status } = req.query
    const clauses = []
    const params = []
    if (req.actor.type === "doctor") {
      params.push(req.actor.doctorId)
      clauses.push(`doctor_id = $${params.length}`)
    } else if (req.actor.type === "patient") {
      params.push(req.actor.patientExternalId)
      clauses.push(`patient_external_id = $${params.length}`)
    }
    if (status) {
      params.push(status)
      clauses.push(`status = $${params.length}`)
    }
    let sql =
      "SELECT * FROM appointments" + (clauses.length ? " WHERE " + clauses.join(" AND ") : "") + " ORDER BY scheduled_at DESC"
    const result = await pool.query(sql, params)
    res.json({ success: true, data: result.rows })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /appointments/{id}:
 *   get:
 *     summary: Get appointment by ID
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Appointment
 */
router.get("/:id", appointmentAuth, async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM appointments WHERE id=$1", [req.params.id])
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Appointment not found" })
    }
    const appt = result.rows[0]
    if (req.actor.type === "doctor" && appt.doctor_id !== req.actor.doctorId) {
      return res.status(403).json({ success: false, message: "Forbidden" })
    }
    if (req.actor.type === "patient" && appt.patient_external_id !== req.actor.patientExternalId) {
      return res.status(403).json({ success: false, message: "Forbidden" })
    }
    res.json({ success: true, data: appt })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /appointments/{id}/status:
 *   post:
 *     summary: Update appointment status (confirm/reschedule/cancel)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: ["confirmed","rescheduled","canceled","completed"] }
 *               scheduledAt: { type: string, format: date-time }
 *               durationMinutes: { type: integer }
 *               meetingUrl: { type: string }
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 */
router.post("/:id/status", appointmentAuth, async (req, res, next) => {
  try {
    const body = appointmentStatusSchema.parse(req.body)
    // fetch appointment for authorization and to ensure ownership
    const existing = await pool.query("SELECT * FROM appointments WHERE id=$1", [req.params.id])
    if (existing.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Appointment not found" })
    }
    const appt = existing.rows[0]

    if (req.actor.type === "doctor") {
      if (appt.doctor_id !== req.actor.doctorId) {
        return res.status(403).json({ success: false, message: "Forbidden" })
      }
    } else if (req.actor.type === "patient") {
      if (appt.patient_external_id !== req.actor.patientExternalId) {
        return res.status(403).json({ success: false, message: "Forbidden" })
      }
      // patients can only cancel
      if (body.status !== "canceled") {
        return res.status(403).json({ success: false, message: "Patients can only cancel appointments" })
      }
    }

    const updates = ["status = $1", "updated_at = NOW()"]
    const params = [body.status]

    if (body.status === "rescheduled" && body.scheduledAt) {
      params.push(body.scheduledAt)
      updates.push(`scheduled_at = $${params.length}`)
    }
    if (body.durationMinutes) {
      params.push(body.durationMinutes)
      updates.push(`duration_minutes = $${params.length}`)
    }
    if (body.meetingUrl) {
      params.push(body.meetingUrl)
      updates.push(`meeting_url = $${params.length}`)
    }
    if (body.reason) {
      const field = body.status === "canceled" ? "cancel_reason" : body.status === "rescheduled" ? "reschedule_reason" : "reason"
      params.push(body.reason)
      updates.push(`${field} = $${params.length}`)
    }

    params.push(req.params.id)
    const sql = `UPDATE appointments SET ${updates.join(", ")} WHERE id = $${params.length} RETURNING *`
    const result = await pool.query(sql, params)
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Appointment not found" })
    }
    const updated = result.rows[0]

    // auto-create or bump patient record when confirmed/completed
    if (["confirmed", "completed"].includes(body.status)) {
      let profile = null
      if (updated.patient_external_id) {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", updated.patient_external_id).maybeSingle()
        if (!error) profile = data
      }
      const profileName = profile?.full_name || profile?.name || "Patient"
      const profileEmail = profile?.email || null
      const profilePhone = profile?.phone || profile?.phone_number || null
      const profileAddress =
        profile?.address ||
        [profile?.city, profile?.country].filter(Boolean).join(", ") ||
        null
      const profileAvatar = profile?.avatar_url || profile?.image_url || null

      const rec = await pool.query(
        "SELECT id, consultations FROM patient_records WHERE doctor_id=$1 AND patient_external_id=$2",
        [updated.doctor_id, updated.patient_external_id]
      )
      if (rec.rowCount === 0) {
        const recId = uuidv4()
        const qr = `QR-${updated.patient_external_id?.slice(0, 8) || recId.slice(0, 8)}`
        await pool.query(
          `INSERT INTO patient_records (id, doctor_id, patient_name, patient_email, patient_phone, patient_address, avatar_url, patient_external_id, on_platform, qr_code, consultations)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [
            recId,
            updated.doctor_id,
            profileName,
            profileEmail,
            profilePhone,
            profileAddress,
            profileAvatar,
            updated.patient_external_id,
            true,
            qr,
            1,
          ]
        )
      } else {
        await pool.query(
          "UPDATE patient_records SET consultations = consultations + 1, updated_at=NOW() WHERE id=$1",
          [rec.rows[0].id]
        )
      }
    }

    res.json({ success: true, data: updated })
  } catch (err) {
    next(err)
  }
})

module.exports = router
