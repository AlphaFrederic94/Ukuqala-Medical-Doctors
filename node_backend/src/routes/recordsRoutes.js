const express = require("express")
const { v4: uuidv4 } = require("uuid")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { authMiddleware } = require("../middleware/authMiddleware")
const { pool } = require("../config/db")
const { supabase } = require("../config/supabase")
const { logger } = require("../utils/logger")

const router = express.Router()
router.use(authMiddleware)

const uploadDir = path.join(__dirname, "..", "..", "uploads", "records")
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".dat"
    cb(null, `${uuidv4()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, true)
  },
})

async function hydrateProfiles(records) {
  const ids = Array.from(
    new Set(
      records
        .map((r) => r.patient_external_id)
        .filter(Boolean)
    )
  )
  if (!ids.length) return records
  const { data, error } = await supabase.from("profiles").select("*").in("id", ids)
  const { data: medData, error: medError } = await supabase.from("medical_records").select("*").in("user_id", ids)
  if (error || medError || !data) return records
  const map = new Map(data.map((p) => [p.id, p]))
  const medMap = new Map((medData || []).map((m) => [m.user_id, m]))
  return records.map((r) => {
    const prof = map.get(r.patient_external_id)
    const med = medMap.get(r.patient_external_id)
    if (!prof) return r
    const address = prof.address || [prof.city, prof.country].filter(Boolean).join(", ") || r.patient_address
    return {
      ...r,
      patient_name: r.patient_name && r.patient_name !== "Patient" ? r.patient_name : prof.full_name || prof.name || r.patient_name,
      patient_email: r.patient_email || prof.email || null,
      patient_phone: r.patient_phone || prof.phone || prof.phone_number || null,
      patient_address: address || null,
      avatar_url: r.avatar_url || prof.avatar_url || prof.image_url || null,
      blood_group: r.blood_group || med?.blood_group || null,
      height: r.height || med?.height || null,
      weight: r.weight || med?.weight || null,
      age: med?.age || null,
      gender: med?.gender || null,
      bmi: med?.bmi || null,
    }
  })
}

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT * FROM patient_records WHERE doctor_id=$1 ORDER BY updated_at DESC",
      [req.user.id]
    )
    const hydrated = await hydrateProfiles(result.rows)
    res.json({ success: true, data: hydrated })
  } catch (err) {
    next(err)
  }
})

router.get("/:id", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM patient_records WHERE id=$1 AND doctor_id=$2", [
      req.params.id,
      req.user.id,
    ])
    if (result.rowCount === 0) return res.status(404).json({ success: false, message: "Record not found" })
    const hydrated = await hydrateProfiles(result.rows)
    res.json({ success: true, data: hydrated[0] })
  } catch (err) {
    next(err)
  }
})

router.post("/", async (req, res, next) => {
  try {
    const id = uuidv4()
    const {
      patient_name,
      patient_email,
      patient_phone,
      patient_address,
      avatar_url,
      patient_external_id,
      on_platform = false,
      qr_code,
      consultations = 0,
      treatments = [],
      prescriptions = [],
      attachments = [],
      notes,
    } = req.body

    if (!patient_name) return res.status(400).json({ success: false, message: "patient_name required" })

    const insert = `
      INSERT INTO patient_records (
        id, doctor_id, patient_name, patient_email, patient_phone, patient_address, avatar_url, patient_external_id,
        on_platform, qr_code, consultations, treatments, prescriptions, attachments, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14::jsonb,$15)
      RETURNING *
    `
    const values = [
      id,
      req.user.id,
      patient_name,
      patient_email || null,
      patient_phone || null,
      patient_address || null,
      avatar_url || null,
      patient_external_id || null,
      on_platform,
      qr_code || null,
      consultations,
      JSON.stringify(treatments || []),
      JSON.stringify(prescriptions || []),
      JSON.stringify(attachments || []),
      notes || null,
    ]
    const result = await pool.query(insert, values)
    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (err) {
    next(err)
  }
})

router.put("/:id", async (req, res, next) => {
  try {
    const fields = [
      "patient_name",
      "patient_email",
      "patient_phone",
      "patient_address",
      "avatar_url",
      "patient_external_id",
      "on_platform",
      "qr_code",
      "consultations",
      "treatments",
      "prescriptions",
      "attachments",
      "notes",
    ]
    const updates = []
    const values = []
    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        if (["treatments", "prescriptions", "attachments"].includes(f)) {
          updates.push(`${f} = $${updates.length + 1}::jsonb`)
          values.push(JSON.stringify(req.body[f]))
        } else {
          updates.push(`${f} = $${updates.length + 1}`)
          values.push(req.body[f])
        }
      }
    })
    if (!updates.length) return res.status(400).json({ success: false, message: "No fields to update" })
    updates.push("updated_at = NOW()")
    values.push(req.params.id, req.user.id)
    const result = await pool.query(
      `UPDATE patient_records SET ${updates.join(", ")} WHERE id=$${values.length - 1} AND doctor_id=$${values.length} RETURNING *`,
      values
    )
    if (result.rowCount === 0) return res.status(404).json({ success: false, message: "Record not found" })
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    next(err)
  }
})

router.post("/:id/attachments", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "file required" })
    const fileUrl =
      (process.env.BASE_URL || `${req.protocol}://${req.get("host")}`) + `/uploads/records/${req.file.filename}`
    const recordRes = await pool.query("SELECT attachments FROM patient_records WHERE id=$1 AND doctor_id=$2", [
      req.params.id,
      req.user.id,
    ])
    if (recordRes.rowCount === 0) return res.status(404).json({ success: false, message: "Record not found" })
    const attachments = recordRes.rows[0].attachments || []
    attachments.push({ name: req.file.originalname, size: `${Math.round(req.file.size / 1024)} KB`, url: fileUrl })
    const update = await pool.query(
      "UPDATE patient_records SET attachments=$1::jsonb, updated_at=NOW() WHERE id=$2 AND doctor_id=$3 RETURNING *",
      [JSON.stringify(attachments), req.params.id, req.user.id]
    )
    res.json({ success: true, data: update.rows[0] })
  } catch (err) {
    logger.error({ err }, "Failed to upload attachment")
    next(err)
  }
})

router.post("/:id/avatar", upload.single("avatar"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "avatar required" })
    const fileUrl =
      (process.env.BASE_URL || `${req.protocol}://${req.get("host")}`) + `/uploads/records/${req.file.filename}`
    const update = await pool.query(
      "UPDATE patient_records SET avatar_url=$1, updated_at=NOW() WHERE id=$2 AND doctor_id=$3 RETURNING *",
      [fileUrl, req.params.id, req.user.id]
    )
    if (update.rowCount === 0) return res.status(404).json({ success: false, message: "Record not found" })
    res.json({ success: true, data: update.rows[0] })
  } catch (err) {
    logger.error({ err }, "Failed to upload record avatar")
    next(err)
  }
})

module.exports = router
