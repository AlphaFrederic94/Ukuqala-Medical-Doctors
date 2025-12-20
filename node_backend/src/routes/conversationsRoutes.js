const express = require("express")
const { v4: uuidv4 } = require("uuid")
const { z } = require("zod")
const { pool } = require("../config/db")
const { conversationAuth } = require("../middleware/conversationAuth")
const { encryptPayload, decryptPayload } = require("../utils/crypto")

const router = express.Router()

const createSchema = z.object({
  doctorId: z.string().uuid().optional(),
  patientExternalId: z.string().uuid().optional(),
})

const messageSchema = z.object({
  content: z.string().min(1),
  attachments: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
})

/**
 * @swagger
 * /conversations:
 *   post:
 *     summary: Start a conversation between doctor and patient
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               doctorId:
 *                 type: string
 *                 description: Required if caller is patient
 *               patientExternalId:
 *                 type: string
 *                 description: Required if caller is doctor
 *     responses:
 *       201:
 *         description: Created conversation
 */
router.post("/", conversationAuth, async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body)
    let doctorId = body.doctorId
    let patientExternalId = body.patientExternalId

    if (req.actor.type === "patient") {
      patientExternalId = req.actor.patientExternalId
      if (!doctorId) {
        return res.status(400).json({ success: false, message: "doctorId required" })
      }
    } else if (req.actor.type === "doctor") {
      doctorId = req.actor.doctorId
      if (!patientExternalId) {
        return res.status(400).json({ success: false, message: "patientExternalId required" })
      }
    }

    const id = uuidv4()
    const result = await pool.query(
      "INSERT INTO conversations (id, doctor_id, patient_external_id, status) VALUES ($1,$2,$3,'active') RETURNING *",
      [id, doctorId, patientExternalId]
    )
    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /conversations:
 *   get:
 *     summary: List conversations for current actor
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, concluded, blocked]
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get("/", conversationAuth, async (req, res, next) => {
  try {
    const { status } = req.query
    const clauses = []
    const params = []
    if (req.actor.type === "doctor") {
      params.push(req.actor.doctorId)
      clauses.push(`doctor_id = $${params.length}`)
    } else {
      params.push(req.actor.patientExternalId)
      clauses.push(`patient_external_id = $${params.length}`)
    }
    if (status) {
      params.push(status)
      clauses.push(`status = $${params.length}`)
    }
    const sql =
      "SELECT * FROM conversations" + (clauses.length ? " WHERE " + clauses.join(" AND ") : "") + " ORDER BY updated_at DESC"
    const result = await pool.query(sql, params)
    res.json({ success: true, data: result.rows })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /conversations/{id}/conclude:
 *   post:
 *     summary: Conclude a conversation (doctor only)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 */
router.post("/:id/conclude", conversationAuth, async (req, res, next) => {
  try {
    if (req.actor.type !== "doctor") {
      return res.status(403).json({ success: false, message: "Only doctors can conclude conversations" })
    }
    const reason = req.body?.reason || null
    const result = await pool.query(
      "UPDATE conversations SET status='concluded', reason=$1, closed_at=NOW(), updated_at=NOW() WHERE id=$2 AND doctor_id=$3 RETURNING *",
      [reason, req.params.id, req.actor.doctorId]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Conversation not found" })
    }
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /conversations/{id}/block:
 *   post:
 *     summary: Block a conversation (doctor only)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 */
router.post("/:id/block", conversationAuth, async (req, res, next) => {
  try {
    if (req.actor.type !== "doctor") {
      return res.status(403).json({ success: false, message: "Only doctors can block conversations" })
    }
    const reason = req.body?.reason || null
    const result = await pool.query(
      "UPDATE conversations SET status='blocked', reason=$1, closed_at=NOW(), updated_at=NOW() WHERE id=$2 AND doctor_id=$3 RETURNING *",
      [reason, req.params.id, req.actor.doctorId]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Conversation not found" })
    }
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /conversations/{id}/reopen:
 *   post:
 *     summary: Reopen a conversation (doctor only)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated
 */
router.post("/:id/reopen", conversationAuth, async (req, res, next) => {
  try {
    if (req.actor.type !== "doctor") {
      return res.status(403).json({ success: false, message: "Only doctors can reopen conversations" })
    }
    const result = await pool.query(
      "UPDATE conversations SET status='active', reason=NULL, closed_at=NULL, updated_at=NOW() WHERE id=$1 AND doctor_id=$2 RETURNING *",
      [req.params.id, req.actor.doctorId]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Conversation not found" })
    }
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /conversations/{id}/messages:
 *   get:
 *     summary: Get messages in a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages
 */
router.get("/:id/messages", conversationAuth, async (req, res, next) => {
  try {
    // verify membership
    const convo = await pool.query("SELECT * FROM conversations WHERE id=$1", [req.params.id])
    if (convo.rowCount === 0) return res.status(404).json({ success: false, message: "Conversation not found" })
    const c = convo.rows[0]
    if (req.actor.type === "doctor" && c.doctor_id !== req.actor.doctorId) {
      return res.status(403).json({ success: false, message: "Forbidden" })
    }
    if (req.actor.type === "patient" && c.patient_external_id !== req.actor.patientExternalId) {
      return res.status(403).json({ success: false, message: "Forbidden" })
    }
    const msgs = await pool.query("SELECT * FROM messages WHERE conversation_id=$1 ORDER BY created_at ASC", [req.params.id])
    const decrypted = msgs.rows.map((m) => {
      const payload = decryptPayload(m.encrypted_payload)
      return {
        ...m,
        content: payload?.content || m.content,
        attachments: payload?.attachments || m.attachments || [],
      }
    })
    res.json({ success: true, data: decrypted })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /conversations/{id}/messages:
 *   post:
 *     summary: Send a message in a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string }
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name: { type: string }
 *                     url: { type: string }
 *     responses:
 *       201:
 *         description: Message sent
 */
router.post("/:id/messages", conversationAuth, async (req, res, next) => {
  try {
    const body = messageSchema.parse(req.body)
    const convo = await pool.query("SELECT * FROM conversations WHERE id=$1", [req.params.id])
    if (convo.rowCount === 0) return res.status(404).json({ success: false, message: "Conversation not found" })
    const c = convo.rows[0]
    if (c.status !== "active") {
      return res.status(400).json({ success: false, message: "Conversation is not active" })
    }
    if (req.actor.type === "doctor" && c.doctor_id !== req.actor.doctorId) {
      return res.status(403).json({ success: false, message: "Forbidden" })
    }
    if (req.actor.type === "patient" && c.patient_external_id !== req.actor.patientExternalId) {
      return res.status(403).json({ success: false, message: "Forbidden" })
    }
    const id = uuidv4()
    const senderType = req.actor.type
    const senderId = senderType === "doctor" ? req.actor.doctorId : req.actor.patientExternalId

    const encryptedPayload = encryptPayload({ content: body.content, attachments: body.attachments || [] })

    const result = await pool.query(
      "INSERT INTO messages (id, conversation_id, sender_type, sender_id, content, attachments, encrypted_payload) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb) RETURNING *",
      [id, req.params.id, senderType, senderId, "[encrypted]", JSON.stringify([]), encryptedPayload]
    )
    // bump updated_at on conversation
    await pool.query("UPDATE conversations SET updated_at = NOW() WHERE id=$1", [req.params.id])
    const payload = decryptPayload(result.rows[0].encrypted_payload)
    res.status(201).json({
      success: true,
      data: {
        ...result.rows[0],
        content: payload?.content,
        attachments: payload?.attachments || [],
      },
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
