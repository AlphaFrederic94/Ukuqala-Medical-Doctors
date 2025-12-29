const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const authRoutes = require("./routes/authRoutes")
const onboardingRoutes = require("./routes/onboardingRoutes")
const doctorsRoutes = require("./routes/doctorsRoutes")
const profileRoutes = require("./routes/profileRoutes")
const patientAuthRoutes = require("./routes/patientAuthRoutes")
const patientProfileRoutes = require("./routes/patientProfileRoutes")
const appointmentsRoutes = require("./routes/appointmentsRoutes")
const conversationsRoutes = require("./routes/conversationsRoutes")
const ratingsRoutes = require("./routes/ratingsRoutes")
const statsRoutes = require("./routes/statsRoutes")
const patientsDoctorRoutes = require("./routes/patientsDoctorRoutes")
const recordsRoutes = require("./routes/recordsRoutes")
const notificationsRoutes = require("./routes/notificationsRoutes")
const chatbotRoutes = require("./routes/chatbotRoutes")
const collaborationRoutes = require("./routes/collaborationRoutes")
const { errorHandler } = require("./middleware/errorHandler")
const { ensureSchema } = require("./config/db")
const { logger } = require("./utils/logger")
const swaggerUi = require("swagger-ui-express")
const { swaggerSpec, SWAGGER_USER, SWAGGER_PASS } = require("./docs/swagger")
const path = require("path")
require("dotenv").config()

const app = express()

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  })
)
app.use(express.json())
app.use(morgan("tiny"))
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")))
app.use(express.static(path.join(__dirname, "..", "public")))

app.get("/health", (req, res) => {
  res.json({ status: "ok" })
})

app.use("/auth", authRoutes)
app.use("/onboarding", onboardingRoutes)
app.use("/doctors", doctorsRoutes)
app.use("/profile", profileRoutes)
app.use("/patients/auth", patientAuthRoutes)
app.use("/patients/profile", patientProfileRoutes)
app.use("/appointments", appointmentsRoutes)
app.use("/conversations", conversationsRoutes)
app.use("/ratings", ratingsRoutes)
app.use("/stats", statsRoutes)
app.use("/patients/doctor", patientsDoctorRoutes)
app.use("/records", recordsRoutes)
app.use("/notifications", notificationsRoutes)
app.use("/chatbot", chatbotRoutes)
app.use("/collaboration", collaborationRoutes)
const swaggerUiServe = swaggerUi.serve
const swaggerUiSetup = swaggerUi.setup(swaggerSpec)

// Basic auth for Swagger if creds provided
const swaggerAuth = (req, res, next) => {
  if (SWAGGER_USER && SWAGGER_PASS) {
    const authHeader = req.headers.authorization || ""
    const encoded = authHeader.split(" ")[1] || ""
    const decoded = Buffer.from(encoded, "base64").toString("utf8")
    const [user, pass] = decoded.split(":")
    if (user === SWAGGER_USER && pass === SWAGGER_PASS) {
      return next()
    }
    res.set("WWW-Authenticate", 'Basic realm="Swagger Docs"')
    return res.status(401).send("Authentication required.")
  }
  return next()
}

app.use("/docs", swaggerAuth, swaggerUiServe, swaggerUiSetup)

app.use(errorHandler)

async function bootstrap() {
  await ensureSchema()
  logger.info("Schema ready")
}

module.exports = { app, bootstrap }
