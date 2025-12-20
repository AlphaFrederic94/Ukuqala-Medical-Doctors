const express = require("express")
const { pool } = require("../config/db")
const { authMiddleware } = require("../middleware/authMiddleware")

const router = express.Router()

/**
 * @swagger
 * /stats/doctor:
 *   get:
 *     summary: Doctor stats (requires doctor JWT)
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats
 */
router.get("/doctor", authMiddleware, async (req, res, next) => {
  try {
    const doctorId = req.user.id

    const [{ rows: appts }, { rows: ratings }, dailyAgg, monthlyAgg, concludedMonthly] = await Promise.all([
      pool.query(
        `SELECT
          COUNT(*)::int AS total_appointments,
          COUNT(*) FILTER (WHERE status='confirmed')::int AS confirmed,
          COUNT(DISTINCT patient_external_id)::int AS total_patients
         FROM appointments WHERE doctor_id=$1`,
        [doctorId]
      ),
      pool.query(
        `SELECT
          COUNT(*)::int AS ratings_count,
          COALESCE(AVG(score),0)::float AS avg_score
         FROM doctor_ratings WHERE doctor_id=$1`,
        [doctorId]
      ),
      pool.query(
        `SELECT date_trunc('day', scheduled_at)::date AS day, COUNT(*)::int AS count
         FROM appointments
         WHERE doctor_id=$1
         GROUP BY 1
         ORDER BY 1 DESC
         LIMIT 14`,
        [doctorId]
      ),
      pool.query(
        `SELECT to_char(month_start, 'Mon') AS month, patients
         FROM (
           SELECT date_trunc('month', scheduled_at) AS month_start,
                  COUNT(DISTINCT patient_external_id)::int AS patients
           FROM appointments
           WHERE doctor_id=$1
           GROUP BY month_start
           ORDER BY month_start DESC
           LIMIT 6
         ) m
         ORDER BY month_start`,
        [doctorId]
      ),
      pool.query(
        `SELECT to_char(month_start, 'Mon') AS month, concluded
         FROM (
           SELECT date_trunc('month', created_at) AS month_start,
                  COUNT(*)::int AS concluded
           FROM conversations
           WHERE doctor_id=$1 AND status='concluded'
           GROUP BY month_start
           ORDER BY month_start DESC
           LIMIT 6
         ) c
         ORDER BY month_start`,
        [doctorId]
      ),
    ])

    const stats = {
      totalAppointments: appts[0]?.total_appointments || 0,
      confirmedAppointments: appts[0]?.confirmed || 0,
      totalPatients: appts[0]?.total_patients || 0,
      concludedConversations: concludedMonthly.rows.reduce((acc, row) => acc + (row.concluded || 0), 0),
      ratingsCount: ratings[0]?.ratings_count || 0,
      avgRating: ratings[0]?.avg_score || 0,
      dailyAppointments: dailyAgg.rows.reverse(), // oldest to newest
      monthlyPatients: monthlyAgg.rows.reverse(),
      monthlyConcluded: concludedMonthly.rows.reverse(),
    }

    res.json({ success: true, data: stats })
  } catch (err) {
    next(err)
  }
})

module.exports = router
