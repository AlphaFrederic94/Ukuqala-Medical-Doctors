const express = require("express")
const { z } = require("zod")
const { v4: uuidv4 } = require("uuid")
const { pool } = require("../config/db")
const { authMiddleware } = require("../middleware/authMiddleware")
const { supabase } = require("../config/supabase")

const router = express.Router()
router.use(authMiddleware)

const startSchema = z.object({
  peerDoctorId: z.string().uuid(),
})

router.post("/chats", async (req, res, next) => {
  try {
    const { peerDoctorId } = startSchema.parse(req.body)
    const doctorId = req.user.id
    if (peerDoctorId === doctorId) {
      return res.status(400).json({ success: false, message: "Cannot start a collaboration with yourself" })
    }
    // enforce deterministic ordering for uniqueness
    const a = doctorId < peerDoctorId ? doctorId : peerDoctorId
    const b = doctorId < peerDoctorId ? peerDoctorId : doctorId
    let convo = await pool.query(
      "SELECT * FROM collab_conversations WHERE doctor_id=$1 AND peer_doctor_id=$2",
      [a, b]
    )
    if (convo.rowCount === 0) {
      const id = uuidv4()
      await pool.query(
        "INSERT INTO collab_conversations (id, doctor_id, peer_doctor_id) VALUES ($1,$2,$3)",
        [id, a, b]
      )
      convo = await pool.query("SELECT * FROM collab_conversations WHERE id=$1", [id])
    }
    res.status(201).json({ success: true, data: convo.rows[0] })
  } catch (err) {
    next(err)
  }
})

router.get("/chats", async (req, res, next) => {
  try {
    const doctorId = req.user.id
    const result = await pool.query(
      `SELECT c.*, d1.first_name AS doctor_first, d1.last_name AS doctor_last, d2.first_name AS peer_first, d2.last_name AS peer_last,
              d1.email AS doctor_email, d2.email AS peer_email,
              d1.avatar_url AS doctor_avatar, d2.avatar_url AS peer_avatar
       FROM collab_conversations c
       JOIN doctors d1 ON c.doctor_id = d1.id
       JOIN doctors d2 ON c.peer_doctor_id = d2.id
       WHERE c.doctor_id=$1 OR c.peer_doctor_id=$1
       ORDER BY c.updated_at DESC`,
      [doctorId]
    )
    res.json({ success: true, data: result.rows })
  } catch (err) {
    next(err)
  }
})

router.get("/chats/:id/messages", async (req, res, next) => {
  try {
    const doctorId = req.user.id
    const convo = await pool.query("SELECT * FROM collab_conversations WHERE id=$1", [req.params.id])
    if (convo.rowCount === 0) return res.status(404).json({ success: false, message: "Conversation not found" })
    const c = convo.rows[0]
    if (c.doctor_id !== doctorId && c.peer_doctor_id !== doctorId) {
      return res.status(403).json({ success: false, message: "Forbidden" })
    }
    const msgs = await pool.query(
      "SELECT id, doctor_id, type, content, metadata, created_at FROM collab_messages WHERE conversation_id=$1 ORDER BY created_at ASC",
      [req.params.id]
    )
    res.json({ success: true, data: msgs.rows })
  } catch (err) {
    next(err)
  }
})

const messageSchema = z.object({
  type: z.enum(["text", "patient_card"]),
  content: z.string().optional(),
  patientId: z.string().optional(),
  patientPayload: z
    .object({
      patientName: z.string(),
      patientAge: z.number(),
      bloodGroup: z.string(),
      medicalCondition: z.string(),
      height: z.string(),
      weight: z.string(),
      avatar: z.string(),
      medicalFileUrl: z.string().optional().nullable(),
    })
    .optional(),
  notes: z.string().optional(),
})

router.post("/chats/:id/messages", async (req, res, next) => {
  try {
    const doctorId = req.user.id
    const body = messageSchema.parse(req.body)
    const convo = await pool.query("SELECT * FROM collab_conversations WHERE id=$1", [req.params.id])
    if (convo.rowCount === 0) return res.status(404).json({ success: false, message: "Conversation not found" })
    const c = convo.rows[0]
    if (c.doctor_id !== doctorId && c.peer_doctor_id !== doctorId) {
      return res.status(403).json({ success: false, message: "Forbidden" })
    }

    let metadata = {}
    if (body.type === "patient_card") {
      let patientMeta = null
      if (body.patientPayload) {
        patientMeta = body.patientPayload
      } else if (body.patientId) {
        const { data } = await supabase.from("profiles").select("*").eq("id", body.patientId).maybeSingle()
        if (data) {
          patientMeta = {
            patientName: data.full_name || data.name || "Patient",
            patientAge: data.age || data.dob || "",
            bloodGroup: data.blood_group || "N/A",
            medicalCondition: data.primary_condition || "N/A",
            height: data.height || "N/A",
            weight: data.weight || "N/A",
            avatar: data.avatar_url || "",
            medicalFileUrl: data.medical_file_url || "",
          }
        }
      }
      metadata = { patient: patientMeta, notes: body.notes || "" }
    }

    const id = uuidv4()
    await pool.query(
      "INSERT INTO collab_messages (id, conversation_id, doctor_id, type, content, metadata) VALUES ($1,$2,$3,$4,$5,$6::jsonb)",
      [id, req.params.id, doctorId, body.type, body.content || "", JSON.stringify(metadata)]
    )
    await pool.query("UPDATE collab_conversations SET updated_at=NOW() WHERE id=$1", [req.params.id])
    const inserted = await pool.query("SELECT id, doctor_id, type, content, metadata, created_at FROM collab_messages WHERE id=$1", [
      id,
    ])
    res.status(201).json({ success: true, data: inserted.rows[0] })
  } catch (err) {
    next(err)
  }
})

module.exports = router
