const express = require("express")
const { authMiddleware } = require("../middleware/authMiddleware")
const { pool } = require("../config/db")
const multer = require("multer")
const path = require("path")
const sharp = require("sharp")
const { logger } = require("../utils/logger")

const router = express.Router()

router.use(authMiddleware)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Only images are allowed"))
    cb(null, true)
  },
})

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get authenticated doctor's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctor profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/Doctor'
 */
router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, email, first_name, last_name, avatar_url, phone, address, education, experience_years, specialty, country, city, timezone, languages, bio, consultation_mode, availability, onboarding_completed FROM doctors WHERE id=$1",
      [req.user.id]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Doctor not found" })
    }
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Update authenticated doctor's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               specialty: { type: string }
 *               country: { type: string }
 *               city: { type: string }
 *               timezone: { type: string }
 *               avatar_url: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 *               education: { type: string }
 *               experience_years: { type: integer }
 *               languages:
 *                 oneOf:
 *                   - type: array
 *                     items: { type: string }
 *                   - type: string
 *               bio: { type: string }
 *               consultation_mode: { type: string }
 *               availability:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day: { type: string }
 *                     start: { type: string }
 *                     end: { type: string }
 *     responses:
 *       200:
 *         description: Updated profile
 */
router.put("/", async (req, res, next) => {
  try {
    const body = { ...req.body }
    if (typeof body.languages === "string") {
      body.languages = body.languages
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    }

    const fields = [
      "first_name",
      "last_name",
      "avatar_url",
      "phone",
      "address",
      "education",
      "experience_years",
      "specialty",
      "country",
      "city",
      "timezone",
      "languages",
      "bio",
      "consultation_mode",
      "availability",
    ]
    const updates = []
    const values = []
    fields.forEach((field) => {
      if (body[field] !== undefined) {
        if (field === "languages" || field === "availability") {
          updates.push(`${field} = $${updates.length + 1}::jsonb`)
          values.push(JSON.stringify(body[field]))
        } else {
          updates.push(`${field} = $${updates.length + 1}`)
          values.push(body[field])
        }
      }
    })

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" })
    }

    updates.push(`updated_at = NOW()`)

    const query = `
      UPDATE doctors
      SET ${updates.join(", ")}
      WHERE id = $${values.length + 1}
      RETURNING id, email, first_name, last_name, avatar_url, phone, address, education, experience_years, specialty, country, city, timezone, languages, bio, consultation_mode, availability, onboarding_completed
    `
    values.push(req.user.id)
    const result = await pool.query(query, values)
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /profile/avatar:
 *   post:
 *     summary: Upload profile photo (doctor)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Updated profile with avatar URL
 */
router.post("/avatar", upload.single("avatar"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Avatar file required" })
    // Compress and normalize the image before storing (max 512x512, jpeg)
    const buffer = await sharp(req.file.buffer)
      .rotate()
      .resize(512, 512, { fit: "cover" })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer()

    const fileUrl = `data:image/jpeg;base64,${buffer.toString("base64")}`

    const result = await pool.query(
      "UPDATE doctors SET avatar_url=$1, updated_at=NOW() WHERE id=$2 RETURNING id, email, first_name, last_name, avatar_url, phone, address, education, experience_years, specialty, country, city, timezone, languages, bio, consultation_mode, availability, onboarding_completed",
      [fileUrl, req.user.id]
    )
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      err.status = 400
      err.message = "Image too large. Please upload an image under 10MB."
    }
    logger.error({ err }, "Failed to upload avatar")
    next(err)
  }
})

module.exports = router
