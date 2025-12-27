const express = require("express")
const { pool } = require("../config/db")

const router = express.Router()

/**
 * @swagger
 * /doctors:
 *   get:
 *     summary: Get all doctors
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: onboardingCompleted
 *         schema:
 *           type: boolean
 *         description: Filter by onboarding_completed flag
 *     responses:
 *       200:
 *         description: List of doctors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Doctor'
 */
router.get("/", async (req, res, next) => {
  const { onboardingCompleted } = req.query
  try {
    const params = []
    const filters = []
    if (onboardingCompleted !== undefined) {
      params.push(onboardingCompleted === "true")
      filters.push(`d.onboarding_completed = $${params.length}`)
    }

    const sql = `
      SELECT
        d.id,
        d.email,
        d.first_name,
        d.last_name,
        d.specialty,
        d.country,
        d.city,
        d.timezone,
        d.languages,
        d.bio,
        d.consultation_mode,
        d.availability,
        d.onboarding_completed,
        d.avatar_url,
        d.experience_years,
        COALESCE(r.avg_rating, 0)::float AS rating,
        COALESCE(r.rating_count, 0)::int AS rating_count
      FROM doctors d
      LEFT JOIN (
        SELECT doctor_id, AVG(score) AS avg_rating, COUNT(*) AS rating_count
        FROM doctor_ratings
        GROUP BY doctor_id
      ) r ON r.doctor_id = d.id
      ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
      ORDER BY d.created_at DESC
    `

    const result = await pool.query(sql, params)
    res.json({ success: true, data: result.rows })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /doctors/{id}:
 *   get:
 *     summary: Get doctor by ID
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Doctor details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Doctor'
 *       404:
 *         description: Doctor not found
 */
router.get("/:id", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
        d.id,
        d.email,
        d.first_name,
        d.last_name,
        d.specialty,
        d.country,
        d.city,
        d.timezone,
        d.languages,
        d.bio,
        d.consultation_mode,
        d.availability,
        d.onboarding_completed,
        d.avatar_url,
        d.experience_years,
        COALESCE(r.avg_rating, 0)::float AS rating,
        COALESCE(r.rating_count, 0)::int AS rating_count
      FROM doctors d
      LEFT JOIN (
        SELECT doctor_id, AVG(score) AS avg_rating, COUNT(*) AS rating_count
        FROM doctor_ratings
        GROUP BY doctor_id
      ) r ON r.doctor_id = d.id
      WHERE d.id=$1`,
      [req.params.id]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Doctor not found" })
    }
    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    next(err)
  }
})

module.exports = router
