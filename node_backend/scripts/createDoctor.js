const request = require("supertest")
const { app, bootstrap } = require("../src/app")
const { pool } = require("../src/config/db")

async function main() {
  await bootstrap()

  const email = `doctor_${Date.now()}@example.com`
  const password = "Secret123!"
  const firstName = "Onboard"
  const lastName = "Doctor"

  // Sign up
  const signup = await request(app)
    .post("/auth/signup")
    .send({ email, password, firstName, lastName })
    .expect(201)

  const token = signup.body.data.token
  const userId = signup.body.data.user.id

  // Onboarding payload
  const onboardingPayload = {
    specialty: "General Practitioner",
    country: "USA",
    city: "Austin",
    timezone: "UTC-5 (EST)",
    languages: ["English"],
    bio: "Experienced GP focused on preventative care.",
    consultation_mode: "both",
    availability: [
      { day: "Mon", start: "09:00", end: "17:00" },
      { day: "Tue", start: "09:00", end: "17:00" },
    ],
  }

  await request(app).post("/onboarding").set("Authorization", `Bearer ${token}`).send(onboardingPayload).expect(200)

  // Fetch doctor by id to confirm
  const doctor = await request(app).get(`/doctors/${userId}`).expect(200)

  console.log("Doctor created and onboarded:")
  console.log(JSON.stringify({ email, userId, onboarding_completed: doctor.body.data.onboarding_completed }, null, 2))

  // Close pool to exit cleanly
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
