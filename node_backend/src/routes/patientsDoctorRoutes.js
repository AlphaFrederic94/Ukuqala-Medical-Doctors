const express = require("express")
const { authMiddleware } = require("../middleware/authMiddleware")
const { pool } = require("../config/db")
const { supabase } = require("../config/supabase")

const router = express.Router()

async function fetchMedicalRecords(userIds = []) {
  if (!userIds.length) return []
  const { data, error } = await supabase.from("medical_records").select("*").in("user_id", userIds)
  if (error || !data) return []
  return data
}

// List patients for a doctor based on appointments
router.get("/list", authMiddleware, async (req, res, next) => {
  try {
    const doctorId = req.user.id
    const appts = await pool.query("SELECT DISTINCT patient_external_id FROM appointments WHERE doctor_id=$1", [doctorId])
    const ids = appts.rows.map((r) => r.patient_external_id).filter(Boolean)
    if (ids.length === 0) {
      return res.json({ success: true, data: [] })
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, address, avatar_url, onboarding_completed, created_at, updated_at, date_of_birth")
      .in("id", ids)
    if (error) {
      throw new Error(error.message)
    }
    const medRecords = await fetchMedicalRecords(ids)
    const medMap = new Map(medRecords.map((m) => [m.user_id, m]))
    const mapped = (data || []).map((p) => {
      const med = medMap.get(p.id)
      return {
        id: p.id,
        full_name: p.full_name || "Patient",
        email: p.email || null,
        phone: p.phone || null,
        address: p.address || null,
        avatar_url: p.avatar_url || null,
        onboarding_completed: p.onboarding_completed || false,
        blood_group: med?.blood_group || null,
        height: med?.height || null,
        weight: med?.weight || null,
        age: med?.age || null,
        gender: med?.gender || null,
      }
    })
    res.json({ success: true, data: mapped })
  } catch (err) {
    next(err)
  }
})

// Get single patient profile by external id
router.get("/:externalId", authMiddleware, async (req, res, next) => {
  try {
    const doctorId = req.user.id
    // verify doctor has an appointment with this patient
    const appt = await pool.query(
      "SELECT 1 FROM appointments WHERE doctor_id=$1 AND patient_external_id=$2 LIMIT 1",
      [doctorId, req.params.externalId]
    )
    if (appt.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Patient not found for this doctor" })
    }
    const { data, error } = await supabase.from("profiles").select("*").eq("id", req.params.externalId).maybeSingle()
    if (error) throw new Error(error.message)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
})

module.exports = router
