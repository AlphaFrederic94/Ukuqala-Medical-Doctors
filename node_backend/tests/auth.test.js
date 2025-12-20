const { test, before, after } = require("node:test")
const assert = require("node:assert")
const request = require("supertest")
const { app, bootstrap } = require("../src/app")
const { pool } = require("../src/config/db")

const randomEmail = `test_${Date.now()}@example.com`
let token
let userId
const patientEmail = "zack@gmail.com"
const patientPassword = "Hello@94fbr"
const patientPin = "12345"
let patientAccessToken = ""
let appointmentId = ""
let conversationId = ""
let doctorIdStatic = ""

before(async () => {
  await bootstrap()
})

after(async () => {
  if (randomEmail) {
    await pool.query("DELETE FROM doctors WHERE email = $1", [randomEmail])
  }
  await pool.end()
})

test("signup -> signin -> onboarding", async () => {
  // Sign up
  const signup = await request(app)
    .post("/auth/signup")
    .send({ email: randomEmail, password: "secret123", firstName: "Test", lastName: "User" })
    .expect(201)
  assert.ok(signup.body.success)
  assert.ok(signup.body.data.token)
  userId = signup.body.data.user.id
  doctorIdStatic = userId

  // Sign in
  const signin = await request(app)
    .post("/auth/signin")
    .send({ email: randomEmail, password: "secret123" })
    .expect(200)
  token = signin.body.data.token
  assert.ok(token)

  // Onboarding save
  const onboardingPayload = {
    specialty: "Cardiology",
    country: "USA",
    city: "Austin",
    timezone: "UTC-5 (EST)",
    languages: ["English"],
    bio: "Board certified cardiologist.",
    consultation_mode: "virtual",
    availability: [{ day: "Mon", start: "09:00", end: "17:00" }],
  }

  const onboarding = await request(app)
    .post("/onboarding")
    .set("Authorization", `Bearer ${token}`)
    .send(onboardingPayload)
    .expect(200)
  assert.ok(onboarding.body.success)
  assert.strictEqual(onboarding.body.data.onboarding_completed, true)

  // Onboarding fetch
  const getOnboarding = await request(app)
    .get("/onboarding")
    .set("Authorization", `Bearer ${token}`)
    .expect(200)
  assert.ok(getOnboarding.body.success)
  assert.strictEqual(getOnboarding.body.data.doctor.id, userId)

  // Profile get
  const profile = await request(app).get("/profile").set("Authorization", `Bearer ${token}`).expect(200)
  assert.ok(profile.body.success)
  assert.strictEqual(profile.body.data.id, userId)

  // Patient sign in (Supabase-backed)
  const patientSignin = await request(app)
    .post("/patients/auth/signin")
    .send({ email: patientEmail, password: patientPassword, pin: patientPin })
    .expect(200)
  assert.ok(patientSignin.body.success)
  assert.ok(patientSignin.body.data.access_token)
  patientAccessToken = patientSignin.body.data.access_token

  // Patient profile fetch (Supabase)
  const patientProfile = await request(app)
    .get("/patients/profile")
    .set("Authorization", `Bearer ${patientAccessToken}`)
    .expect(200)
  assert.ok(patientProfile.body.success)
  assert.ok(patientProfile.body.data.profile)
  assert.ok(Array.isArray(patientProfile.body.data.medical_records))

  // Patient creates appointment with doctor
  const appointmentPayload = {
    doctorId: userId,
    patientExternalId: patientProfile.body.data.profile.id,
    scheduledAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    durationMinutes: 30,
    type: "virtual",
    reason: "Follow-up consultation",
    attachments: [{ name: "referral.pdf", url: "https://example.com/referral.pdf" }],
  }

  const createAppt = await request(app)
    .post("/appointments")
    .set("Authorization", `Bearer ${patientAccessToken}`)
    .send(appointmentPayload)
    .expect(201)
  appointmentId = createAppt.body.data.id
  assert.ok(appointmentId)

  // Doctor confirms appointment
  const confirm = await request(app)
    .post(`/appointments/${appointmentId}/status`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status: "confirmed", meetingUrl: "https://meet.example.com/abc123" })
    .expect(200)
  assert.strictEqual(confirm.body.data.status, "confirmed")

  // Doctor starts conversation with patient
  const convoCreate = await request(app)
    .post("/conversations")
    .set("Authorization", `Bearer ${token}`)
    .send({ patientExternalId: patientProfile.body.data.profile.id })
    .expect(201)
  conversationId = convoCreate.body.data.id
  assert.ok(conversationId)

  // Doctor sends message
  const docMsg = await request(app)
    .post(`/conversations/${conversationId}/messages`)
    .set("Authorization", `Bearer ${token}`)
    .send({ content: "Hello, your appointment is confirmed.", attachments: [] })
    .expect(201)
  assert.ok(docMsg.body.data.id)

  // Patient sends message
  const patMsg = await request(app)
    .post(`/conversations/${conversationId}/messages`)
    .set("Authorization", `Bearer ${patientAccessToken}`)
    .send({
      content: "Thank you, see you then.",
      attachments: [{ name: "report.pdf", url: "https://example.com/report.pdf" }],
    })
    .expect(201)
  assert.ok(patMsg.body.data.id)

  // List messages
  const msgList = await request(app)
    .get(`/conversations/${conversationId}/messages`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200)
  assert.ok(msgList.body.data.length >= 2)

  // Doctor concludes conversation
  const conclude = await request(app)
    .post(`/conversations/${conversationId}/conclude`)
    .set("Authorization", `Bearer ${token}`)
    .send({ reason: "Resolved" })
    .expect(200)
  assert.strictEqual(conclude.body.data.status, "concluded")

  // Patient rates doctor after conversation concluded
  const rating = await request(app)
    .post("/ratings")
    .set("Authorization", `Bearer ${patientAccessToken}`)
    .send({ doctorId: doctorIdStatic, conversationId, score: 5, comment: "Great consultation" })
    .expect(201)
  assert.ok(rating.body.data.id)

  // Doctor fetches ratings
  const doctorRatings = await request(app).get("/ratings/doctor").set("Authorization", `Bearer ${token}`).expect(200)
  assert.ok(doctorRatings.body.data.length >= 1)

  // Doctor stats
  const stats = await request(app).get("/stats/doctor").set("Authorization", `Bearer ${token}`).expect(200)
  assert.ok(stats.body.data.totalAppointments >= 1)
  assert.ok(stats.body.data.totalPatients >= 1)
})
