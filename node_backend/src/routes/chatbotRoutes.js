const express = require("express")
const { z } = require("zod")
const { v4: uuidv4 } = require("uuid")
const { pool } = require("../config/db")
const { authMiddleware } = require("../middleware/authMiddleware")

const router = express.Router()

const mistralInstructions = `# Qala-Lwazi: Advanced Medical Intelligence System

You are Qala-Lwazi, a medical assistant by Ukuqala Labs. Follow the provided conversation instructions to stay safe, patient-centric, and helpful.`

let mistralClient = null
async function getMistralClient() {
  if (mistralClient) return mistralClient
  const { Mistral } = await import("@mistralai/mistralai")
  mistralClient = new Mistral({ apiKey: process.env.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY_2 })
  return mistralClient
}

router.use(authMiddleware)

router.post("/conversations", async (req, res, next) => {
  try {
    const title = typeof req.body?.title === "string" && req.body.title.trim() ? req.body.title.trim() : "New chat"
    const id = uuidv4()
    await pool.query("INSERT INTO chatbot_conversations (id, doctor_id, title) VALUES ($1,$2,$3)", [id, req.user.id, title])
    res.status(201).json({ success: true, data: { id, title } })
  } catch (err) {
    next(err)
  }
})

router.get("/conversations", async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, title, created_at FROM chatbot_conversations WHERE doctor_id=$1 ORDER BY created_at DESC",
      [req.user.id]
    )
    res.json({ success: true, data: result.rows })
  } catch (err) {
    next(err)
  }
})

router.get("/conversations/:id/messages", async (req, res, next) => {
  try {
    const convo = await pool.query("SELECT id FROM chatbot_conversations WHERE id=$1 AND doctor_id=$2", [
      req.params.id,
      req.user.id,
    ])
    if (convo.rowCount === 0) return res.status(404).json({ success: false, message: "Conversation not found" })
    const msgs = await pool.query(
      "SELECT id, role, content, metadata, created_at FROM chatbot_messages WHERE conversation_id=$1 ORDER BY created_at ASC",
      [req.params.id]
    )
    res.json({ success: true, data: msgs.rows })
  } catch (err) {
    next(err)
  }
})

const sendSchema = z.object({
  content: z.string().min(1),
})

router.post("/conversations/:id/messages", async (req, res, next) => {
  try {
    const body = sendSchema.parse(req.body)
    const convo = await pool.query("SELECT id FROM chatbot_conversations WHERE id=$1 AND doctor_id=$2", [
      req.params.id,
      req.user.id,
    ])
    if (convo.rowCount === 0) return res.status(404).json({ success: false, message: "Conversation not found" })

    const userMsgId = uuidv4()
    await pool.query(
      "INSERT INTO chatbot_messages (id, conversation_id, doctor_id, role, content, metadata) VALUES ($1,$2,$3,'user',$4,$5::jsonb)",
      [userMsgId, req.params.id, req.user.id, body.content, JSON.stringify({})]
    )

    const historyRes = await pool.query(
      "SELECT role, content FROM chatbot_messages WHERE conversation_id=$1 ORDER BY created_at ASC LIMIT 30",
      [req.params.id]
    )
    const history = historyRes.rows.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }))
    history.push({ role: "user", content: body.content })

    const client = await getMistralClient()
    const response = await client.beta.conversations.start({
      inputs: history,
      model: "mistral-medium-latest",
      instructions: mistralInstructions,
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1,
      tools: [{ type: "web_search", openResults: false }],
    })

    const assistantContent =
      response?.message?.content || response?.outputs?.[0]?.content || "I'm here to assist with your medical questions."
    const assistantMsgId = uuidv4()
    await pool.query(
      "INSERT INTO chatbot_messages (id, conversation_id, doctor_id, role, content, metadata) VALUES ($1,$2,$3,'assistant',$4,$5::jsonb)",
      [assistantMsgId, req.params.id, req.user.id, assistantContent, JSON.stringify({ model: "mistral-medium-latest" })]
    )

    const messages = await pool.query(
      "SELECT id, role, content, metadata, created_at FROM chatbot_messages WHERE conversation_id=$1 ORDER BY created_at ASC",
      [req.params.id]
    )

    res.status(201).json({ success: true, data: messages.rows })
  } catch (err) {
    next(err)
  }
})

const reactionSchema = z.object({
  reaction: z.enum(["like", "save"]),
  active: z.boolean().default(true),
})

router.post("/messages/:id/reaction", async (req, res, next) => {
  try {
    const body = reactionSchema.parse(req.body)
    const message = await pool.query(
      `SELECT m.id, c.doctor_id FROM chatbot_messages m
       JOIN chatbot_conversations c ON m.conversation_id = c.id
       WHERE m.id=$1 AND c.doctor_id=$2`,
      [req.params.id, req.user.id]
    )
    if (message.rowCount === 0) return res.status(404).json({ success: false, message: "Message not found" })

    if (body.active) {
      const id = uuidv4()
      await pool.query(
        `INSERT INTO chatbot_message_reactions (id, message_id, doctor_id, reaction)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (message_id, doctor_id, reaction) DO NOTHING`,
        [id, req.params.id, req.user.id, body.reaction]
      )
    } else {
      await pool.query(
        "DELETE FROM chatbot_message_reactions WHERE message_id=$1 AND doctor_id=$2 AND reaction=$3",
        [req.params.id, req.user.id, body.reaction]
      )
    }
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
