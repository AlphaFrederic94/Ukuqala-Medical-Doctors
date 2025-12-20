const express = require("express")
const { z } = require("zod")
const { signUp, signIn, changePassword } = require("../services/authService")
const { authMiddleware } = require("../middleware/authMiddleware")

const router = express.Router()

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
})

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const resetSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
})
/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Doctor sign up
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/signup", async (req, res, next) => {
  try {
    const body = signUpSchema.parse(req.body)
    const result = await signUp(body)
    res.status(201).json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /auth/signin:
 *   post:
 *     summary: Doctor sign in
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: OK
 */
router.post("/signin", async (req, res, next) => {
  try {
    const body = signInSchema.parse(req.body)
    const result = await signIn(body)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
})

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Change password for authenticated doctor
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200:
 *         description: Password updated
 */
router.post("/reset-password", authMiddleware, async (req, res, next) => {
  try {
    const body = resetSchema.parse(req.body)
    await changePassword({ doctorId: req.user.id, currentPassword: body.currentPassword, newPassword: body.newPassword })
    res.json({ success: true, message: "Password updated" })
  } catch (err) {
    next(err)
  }
})

module.exports = router
