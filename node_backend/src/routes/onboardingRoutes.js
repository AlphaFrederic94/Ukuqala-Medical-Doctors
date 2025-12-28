const express = require("express")
const { z } = require("zod")
const { saveOnboarding, getOnboarding } = require("../services/onboardingService")
const { authMiddleware } = require("../middleware/authMiddleware")

const router = express.Router()

const onboardingSchema = z.object({
  specialty: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  timezone: z.string().optional(),
  languages: z.union([z.array(z.string()), z.string()]).optional(),
  bio: z.string().optional(),
  consultation_mode: z.string().optional(),
  avatar_url: z.string().url().optional(),
  availability: z.array(z.object({ day: z.string(), start: z.string(), end: z.string() })).optional(),
})

router.use(authMiddleware)

/**
 * @swagger
 * /onboarding:
 *   get:
 *     summary: Get onboarding state for authenticated doctor
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding state
 */
router.get("/", async (req, res, next) => {
  try {
    const payload = await getOnboarding(req.user.id)
    res.json({ success: true, data: payload })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /onboarding:
 *   post:
 *     summary: Save onboarding profile
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               specialty: { type: string }
 *               country: { type: string }
 *               city: { type: string }
 *               timezone: { type: string }
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
 *         description: Updated doctor profile
 */
router.post("/", async (req, res, next) => {
  try {
    const body = onboardingSchema.parse(req.body)
    // normalize languages if string comma separated
    if (typeof body.languages === "string") {
      body.languages = body.languages
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    }
    const updated = await saveOnboarding(req.user.id, body)
    res.json({ success: true, data: updated })
  } catch (err) {
    next(err)
  }
})

module.exports = router
