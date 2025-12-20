const express = require("express")
const { z } = require("zod")
const { signInPatient } = require("../services/patientAuthService")

const router = express.Router()

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  pin: z.string().min(4),
})

/**
 * @swagger
 * /patients/auth/signin:
 *   post:
 *     summary: Patient sign in via Supabase Auth + app pin
 *     tags: [Patients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               pin: { type: string }
 *     responses:
 *       200:
 *         description: Auth success
 */
router.post("/signin", async (req, res, next) => {
  try {
    const body = signInSchema.parse(req.body)
    const result = await signInPatient(body)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
})

module.exports = router
