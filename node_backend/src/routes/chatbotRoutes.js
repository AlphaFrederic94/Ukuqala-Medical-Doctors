const express = require("express")
const { z } = require("zod")
const { v4: uuidv4 } = require("uuid")
const { pool } = require("../config/db")
const { conversationAuth } = require("../middleware/conversationAuth")

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

router.use(conversationAuth)

router.post("/conversations", async (req, res, next) => {
  try {
	    const actor = req.actor
	    if (!actor) return res.status(401).json({ success: false, message: "Unauthorized" })
	
	    const title = typeof req.body?.title === "string" && req.body.title.trim() ? req.body.title.trim() : "New chat"
	    const id = uuidv4()
	
	    if (actor.type === "doctor") {
	      await pool.query("INSERT INTO chatbot_conversations (id, doctor_id, title) VALUES ($1,$2,$3)", [
	        id,
	        actor.doctorId,
	        title,
	      ])
	    } else if (actor.type === "patient") {
	      await pool.query(
	        "INSERT INTO patient_chatbot_conversations (id, patient_external_id, title) VALUES ($1,$2,$3)",
	        [id, actor.patientExternalId, title]
	      )
	    } else {
	      return res.status(403).json({ success: false, message: "Unsupported actor type" })
	    }
	
	    res.status(201).json({ success: true, data: { id, title } })
  } catch (err) {
    next(err)
  }
})

router.get("/conversations", async (req, res, next) => {
  try {
	    const actor = req.actor
	    if (!actor) return res.status(401).json({ success: false, message: "Unauthorized" })
	
	    let result
	    if (actor.type === "doctor") {
	      result = await pool.query(
	        "SELECT id, title, created_at FROM chatbot_conversations WHERE doctor_id=$1 ORDER BY created_at DESC",
	        [actor.doctorId]
	      )
	    } else if (actor.type === "patient") {
	      result = await pool.query(
	        "SELECT id, title, created_at FROM patient_chatbot_conversations WHERE patient_external_id=$1 ORDER BY created_at DESC",
	        [actor.patientExternalId]
	      )
	    } else {
	      return res.status(403).json({ success: false, message: "Unsupported actor type" })
	    }
	
	    res.json({ success: true, data: result.rows })
  } catch (err) {
    next(err)
  }
})

router.put("/conversations/:id", async (req, res, next) => {
  try {
    const actor = req.actor
    if (!actor) return res.status(401).json({ success: false, message: "Unauthorized" })

    const { title } = req.body
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" })
    }

    let result
    if (actor.type === "doctor") {
      result = await pool.query(
        "UPDATE chatbot_conversations SET title=$1 WHERE id=$2 AND doctor_id=$3 RETURNING id, title, created_at",
        [title.trim(), req.params.id, actor.doctorId]
      )
    } else if (actor.type === "patient") {
      result = await pool.query(
        "UPDATE patient_chatbot_conversations SET title=$1 WHERE id=$2 AND patient_external_id=$3 RETURNING id, title, created_at",
        [title.trim(), req.params.id, actor.patientExternalId]
      )
    } else {
      return res.status(403).json({ success: false, message: "Unsupported actor type" })
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Conversation not found" })
    }

    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    next(err)
  }
})

router.get("/conversations/:id/messages", async (req, res, next) => {
  try {
	    const actor = req.actor
	    if (!actor) return res.status(401).json({ success: false, message: "Unauthorized" })
	
	    let convo
	    let msgs
	
	    if (actor.type === "doctor") {
	      convo = await pool.query("SELECT id FROM chatbot_conversations WHERE id=$1 AND doctor_id=$2", [
	        req.params.id,
	        actor.doctorId,
	      ])
	      if (convo.rowCount === 0)
	        return res.status(404).json({ success: false, message: "Conversation not found" })
	
	      msgs = await pool.query(
	        "SELECT id, role, content, metadata, created_at FROM chatbot_messages WHERE conversation_id=$1 ORDER BY created_at ASC",
	        [req.params.id]
	      )
	    } else if (actor.type === "patient") {
	      convo = await pool.query(
	        "SELECT id FROM patient_chatbot_conversations WHERE id=$1 AND patient_external_id=$2",
	        [req.params.id, actor.patientExternalId]
	      )
	      if (convo.rowCount === 0)
	        return res.status(404).json({ success: false, message: "Conversation not found" })
	
	      msgs = await pool.query(
	        "SELECT id, role, content, metadata, created_at FROM patient_chatbot_messages WHERE conversation_id=$1 ORDER BY created_at ASC",
	        [req.params.id]
	      )
	    } else {
	      return res.status(403).json({ success: false, message: "Unsupported actor type" })
	    }
	
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
	    const actor = req.actor
	    if (!actor) return res.status(401).json({ success: false, message: "Unauthorized" })

	    let convo
	    if (actor.type === "doctor") {
	      convo = await pool.query("SELECT id FROM chatbot_conversations WHERE id=$1 AND doctor_id=$2", [
	        req.params.id,
	        actor.doctorId,
	      ])
	    } else if (actor.type === "patient") {
	      convo = await pool.query(
	        "SELECT id FROM patient_chatbot_conversations WHERE id=$1 AND patient_external_id=$2",
	        [req.params.id, actor.patientExternalId]
	      )
	    } else {
	      return res.status(403).json({ success: false, message: "Unsupported actor type" })
	    }
	
	    if (!convo || convo.rowCount === 0)
	      return res.status(404).json({ success: false, message: "Conversation not found" })

	    const userMsgId = uuidv4()
	    if (actor.type === "doctor") {
	      await pool.query(
	        "INSERT INTO chatbot_messages (id, conversation_id, doctor_id, role, content, metadata) VALUES ($1,$2,$3,'user',$4,$5::jsonb)",
	        [userMsgId, req.params.id, actor.doctorId, body.content, JSON.stringify({})]
	      )
	    } else {
	      await pool.query(
	        "INSERT INTO patient_chatbot_messages (id, conversation_id, patient_external_id, role, content, metadata) VALUES ($1,$2,$3,'user',$4,$5::jsonb)",
	        [userMsgId, req.params.id, actor.patientExternalId, body.content, JSON.stringify({})]
	      )
	    }

	    const historyQuery =
	      actor.type === "doctor"
	        ? "SELECT role, content FROM chatbot_messages WHERE conversation_id=$1 ORDER BY created_at ASC LIMIT 30"
	        : "SELECT role, content FROM patient_chatbot_messages WHERE conversation_id=$1 ORDER BY created_at ASC LIMIT 30"
	
	    const historyRes = await pool.query(historyQuery, [req.params.id])
	    const history = historyRes.rows.map((m) => ({
	      role: m.role === "assistant" ? "assistant" : "user",
	      content: m.content,
	    }))
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
	
	    if (actor.type === "doctor") {
	      await pool.query(
	        "INSERT INTO chatbot_messages (id, conversation_id, doctor_id, role, content, metadata) VALUES ($1,$2,$3,'assistant',$4,$5::jsonb)",
	        [assistantMsgId, req.params.id, actor.doctorId, assistantContent, JSON.stringify({ model: "mistral-medium-latest" })]
	      )
	    } else {
	      await pool.query(
	        "INSERT INTO patient_chatbot_messages (id, conversation_id, patient_external_id, role, content, metadata) VALUES ($1,$2,$3,'assistant',$4,$5::jsonb)",
	        [
	          assistantMsgId,
	          req.params.id,
	          actor.patientExternalId,
	          assistantContent,
	          JSON.stringify({ model: "mistral-medium-latest" }),
	        ]
	      )
	    }

	    const messagesQuery =
	      actor.type === "doctor"
	        ? "SELECT id, role, content, metadata, created_at FROM chatbot_messages WHERE conversation_id=$1 ORDER BY created_at ASC"
	        : "SELECT id, role, content, metadata, created_at FROM patient_chatbot_messages WHERE conversation_id=$1 ORDER BY created_at ASC"
	
	    const messages = await pool.query(messagesQuery, [req.params.id])

	    res.status(201).json({ success: true, data: messages.rows })
  } catch (err) {
    next(err)
  }
})

router.delete("/conversations/:id", async (req, res, next) => {
  try {
    const actor = req.actor
    if (!actor) return res.status(401).json({ success: false, message: "Unauthorized" })

    let convo
    if (actor.type === "doctor") {
      convo = await pool.query("SELECT id FROM chatbot_conversations WHERE id=$1 AND doctor_id=$2", [
        req.params.id,
        actor.doctorId,
      ])
      if (convo.rowCount === 0)
        return res.status(404).json({ success: false, message: "Conversation not found" })

      // Delete messages first (foreign key constraint)
      await pool.query("DELETE FROM chatbot_messages WHERE conversation_id=$1", [req.params.id])

      // Delete message reactions
      await pool.query(
        "DELETE FROM chatbot_message_reactions WHERE message_id IN (SELECT id FROM chatbot_messages WHERE conversation_id=$1)",
        [req.params.id]
      )

      // Delete conversation
      await pool.query("DELETE FROM chatbot_conversations WHERE id=$1 AND doctor_id=$2", [
        req.params.id,
        actor.doctorId,
      ])
    } else if (actor.type === "patient") {
      convo = await pool.query(
        "SELECT id FROM patient_chatbot_conversations WHERE id=$1 AND patient_external_id=$2",
        [req.params.id, actor.patientExternalId]
      )
      if (convo.rowCount === 0)
        return res.status(404).json({ success: false, message: "Conversation not found" })

      // Delete messages first (foreign key constraint)
      await pool.query("DELETE FROM patient_chatbot_messages WHERE conversation_id=$1", [req.params.id])

      // Delete conversation
      await pool.query("DELETE FROM patient_chatbot_conversations WHERE id=$1 AND patient_external_id=$2", [
        req.params.id,
        actor.patientExternalId,
      ])
    } else {
      return res.status(403).json({ success: false, message: "Unsupported actor type" })
    }

    res.json({ success: true, message: "Conversation deleted successfully" })
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
	    const actor = req.actor
	    if (!actor) return res.status(401).json({ success: false, message: "Unauthorized" })
	    if (actor.type !== "doctor") {
	      return res
	        .status(403)
	        .json({ success: false, message: "Reactions are only available for doctor accounts" })
	    }

	    const body = reactionSchema.parse(req.body)
	    const message = await pool.query(
	      `SELECT m.id, c.doctor_id FROM chatbot_messages m
	       JOIN chatbot_conversations c ON m.conversation_id = c.id
	       WHERE m.id=$1 AND c.doctor_id=$2`,
	      [req.params.id, actor.doctorId]
	    )
	    if (message.rowCount === 0) return res.status(404).json({ success: false, message: "Message not found" })

	    if (body.active) {
	      const id = uuidv4()
	      await pool.query(
	        `INSERT INTO chatbot_message_reactions (id, message_id, doctor_id, reaction)
	         VALUES ($1,$2,$3,$4)
	         ON CONFLICT (message_id, doctor_id, reaction) DO NOTHING`,
	        [id, req.params.id, actor.doctorId, body.reaction]
	      )
	    } else {
	      await pool.query(
	        "DELETE FROM chatbot_message_reactions WHERE message_id=$1 AND doctor_id=$2 AND reaction=$3",
	        [req.params.id, actor.doctorId, body.reaction]
	      )
	    }
	    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
