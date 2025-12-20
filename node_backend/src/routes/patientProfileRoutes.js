const express = require("express")
const { supabase, supabaseForToken } = require("../config/supabase")

const router = express.Router()

/**
 * @swagger
 * /patients/profile:
 *   get:
 *     summary: Get patient profile & medical records (Supabase)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patient data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile: { type: object }
 *                     medical_records:
 *                       type: array
 *                       items: { type: object }
 */
router.get("/", async (req, res, next) => {
  try {
    const header = req.headers.authorization || ""
    const [, token] = header.split(" ")
    if (!token) {
      return res.status(401).json({ success: false, message: "Missing bearer token" })
    }

    const { data: userData, error: userErr } = await supabase.auth.getUser(token)
    if (userErr || !userData?.user?.id) {
      return res.status(401).json({ success: false, message: "Invalid token" })
    }

    const userId = userData.user.id
    const authedSupabase = supabaseForToken(token)

    const [{ data: profile, error: profileErr }, { data: records, error: recordsErr }] = await Promise.all([
      authedSupabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      authedSupabase.from("medical_records").select("*").eq("user_id", userId),
    ])

    if (profileErr || recordsErr) {
      const err = new Error(profileErr?.message || recordsErr?.message || "Failed to fetch patient data")
      err.status = 500
      throw err
    }

    res.json({ success: true, data: { profile, medical_records: records || [] } })
  } catch (err) {
    next(err)
  }
})

module.exports = router
