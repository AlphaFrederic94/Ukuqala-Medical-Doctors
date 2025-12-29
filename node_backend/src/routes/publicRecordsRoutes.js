const express = require("express")
const { pool } = require("../config/db")
const { supabase } = require("../config/supabase")

const router = express.Router()

// Public fetch of a patient record by record id or QR code
router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id
    const recordRes = await pool.query(
      "SELECT * FROM patient_records WHERE id::text = $1 OR qr_code = $1 LIMIT 1",
      [id]
    )
    if (recordRes.rowCount === 0) return res.status(404).json({ success: false, message: "Record not found" })
    const rec = recordRes.rows[0]

    let profile = null
    if (rec.on_platform && rec.patient_external_id) {
      const { data } = await supabase.from("profiles").select("*").eq("id", rec.patient_external_id).maybeSingle()
      profile = data || null
    }

    const response = {
      id: rec.id,
      qr_code: rec.qr_code,
      patient_name: rec.patient_name,
      patient_email: rec.patient_email,
      patient_phone: rec.patient_phone,
      patient_address: rec.patient_address,
      avatar_url: rec.avatar_url,
      patient_external_id: rec.patient_external_id,
      on_platform: rec.on_platform,
      consultations: rec.consultations,
      treatments: rec.treatments || [],
      prescriptions: rec.prescriptions || [],
      attachments: rec.attachments || [],
      notes: rec.notes,
      created_at: rec.created_at,
      updated_at: rec.updated_at,
      blood_group: rec.blood_group || (profile ? profile.blood_group : null) || null,
      height: rec.height || (profile ? profile.height : null) || null,
      weight: rec.weight || (profile ? profile.weight : null) || null,
      profile: profile
        ? {
            full_name: profile.full_name || profile.name,
            age: profile.age || null,
            gender: profile.gender || null,
            blood_group: profile.blood_group || null,
            height: profile.height || null,
            weight: profile.weight || null,
            avatar_url: profile.avatar_url || profile.image_url || rec.avatar_url,
            primary_condition: profile.primary_condition || null,
            medical_file_url: profile.medical_file_url || null,
          }
        : null,
    }

    res.json({ success: true, data: response })
  } catch (err) {
    next(err)
  }
})

module.exports = router
