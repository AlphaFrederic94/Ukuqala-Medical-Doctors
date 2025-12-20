const express = require("express")
const { v4: uuidv4 } = require("uuid")
const { authMiddleware } = require("../middleware/authMiddleware")
const { pool } = require("../config/db")

const router = express.Router()
router.use(authMiddleware)

router.get("/", async (req, res, next) => {
  try {
    const { unread } = req.query
    const clauses = ["doctor_id = $1"]
    const params = [req.user.id]
    if (unread === "true") {
      clauses.push("unread = TRUE")
    }
    const result = await pool.query(
      `SELECT * FROM notifications WHERE ${clauses.join(" AND ")} ORDER BY created_at DESC LIMIT 100`,
      params
    )
    res.json({ success: true, data: result.rows })
  } catch (err) {
    next(err)
  }
})

router.post("/", async (req, res, next) => {
  try {
    const { type, title, message, meta } = req.body
    if (!type || !title) return res.status(400).json({ success: false, message: "type and title required" })
    const id = uuidv4()
    const result = await pool.query(
      "INSERT INTO notifications (id, doctor_id, type, title, message, meta) VALUES ($1,$2,$3,$4,$5,$6::jsonb) RETURNING *",
      [id, req.user.id, type, title, message || null, JSON.stringify(meta || {})]
    )
    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (err) {
    next(err)
  }
})

router.patch("/:id/read", async (req, res, next) => {
  try {
    const result = await pool.query(
      "UPDATE notifications SET unread=FALSE WHERE id=$1 AND doctor_id=$2 RETURNING *",
      [req.params.id, req.user.id]
    )
    if (result.rowCount === 0) return res.status(404).json({ success: false, message: "Notification not found" })
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    next(err)
  }
})

module.exports = router
