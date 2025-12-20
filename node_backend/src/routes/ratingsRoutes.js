const express = require("express")
const { v4: uuidv4 } = require("uuid")
const { z } = require("zod")
const { pool } = require("../config/db")
const { conversationAuth } = require("../middleware/conversationAuth")

const router = express.Router()

const ratingSchema = z.object({
  doctorId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  score: z.number().int().min(1).max(5),
  comment: z.string().optional(),
})

/**
 * @swagger
 * /ratings:
 *   post:
 *     summary: Submit a rating for a doctor (patient only)
 *     tags: [Ratings]
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
 *               conversationId: { type: string, format: uuid }
 *               score: { type: integer, minimum: 1, maximum: 5 }
 *               comment: { type: string }
 *     responses:
 *       201:
 *         description: Rating created
 */
router.post("/", conversationAuth, async (req, res, next) => {
  try {
    if (req.actor.type !== "patient") {
      return res.status(403).json({ success: false, message: "Only patients can rate doctors" })
    }
    const body = ratingSchema.parse(req.body)

    // Optional: verify conversation belongs to both and is concluded
    if (body.conversationId) {
      const convo = await pool.query("SELECT * FROM conversations WHERE id=$1", [body.conversationId])
      if (convo.rowCount === 0) return res.status(404).json({ success: false, message: "Conversation not found" })
      const c = convo.rows[0]
      if (c.patient_external_id !== req.actor.patientExternalId || c.doctor_id !== body.doctorId) {
        return res.status(403).json({ success: false, message: "Conversation does not belong to this patient/doctor" })
      }
      if (c.status !== "concluded") {
        return res.status(400).json({ success: false, message: "Conversation must be concluded to rate" })
      }
    }

    const id = uuidv4()
    const insert = await pool.query(
      "INSERT INTO doctor_ratings (id, doctor_id, patient_external_id, conversation_id, score, comment) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [id, body.doctorId, req.actor.patientExternalId, body.conversationId || null, body.score, body.comment || null]
    )
    res.status(201).json({ success: true, data: insert.rows[0] })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /ratings/doctor:
 *   get:
 *     summary: Get ratings for authenticated doctor
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ratings list
 */
router.get("/doctor", conversationAuth, async (req, res, next) => {
  try {
    if (req.actor.type !== "doctor") {
      return res.status(403).json({ success: false, message: "Only doctors can view their ratings" })
    }
    const result = await pool.query(
      "SELECT * FROM doctor_ratings WHERE doctor_id=$1 ORDER BY created_at DESC",
      [req.actor.doctorId]
    )
    res.json({ success: true, data: result.rows })
  } catch (err) {
    next(err)
  }
})

module.exports = router
