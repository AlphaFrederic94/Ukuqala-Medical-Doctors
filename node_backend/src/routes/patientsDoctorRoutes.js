const express = require("express")
const { authMiddleware } = require("../middleware/authMiddleware")
const { pool } = require("../config/db")
const { supabase } = require("../config/supabase")

const router = express.Router()

// List patients for a doctor based on appointments
router.get("/list", authMiddleware, async (req, res, next) => {
  try {
    const doctorId = req.user.id
    const appts = await pool.query("SELECT DISTINCT patient_external_id FROM appointments WHERE doctor_id=$1", [doctorId])
    const ids = appts.rows.map((r) => r.patient_external_id).filter(Boolean)
    if (ids.length === 0) {
      return res.json({ success: true, data: [] })
    }
    const { data, error } = await supabase.from("profiles").select("*").in("id", ids)
    if (error) {
      throw new Error(error.message)
    }
    res.json({ success: true, data })
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
