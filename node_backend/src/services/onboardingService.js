const { pool } = require("../config/db")

const REQUIRED_FIELDS = ["specialty", "country", "city", "timezone"]

async function saveOnboarding(userId, payload) {
  const client = await pool.connect()
  try {
    const fields = [
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
      if (payload[field] !== undefined) {
        if (field === "languages" || field === "availability") {
          updates.push(`${field} = $${updates.length + 1}::jsonb`)
          values.push(JSON.stringify(payload[field]))
        } else {
          updates.push(`${field} = $${updates.length + 1}`)
          values.push(payload[field])
        }
      }
    })

    const completed = REQUIRED_FIELDS.every((field) => !!payload[field]) && (payload.availability?.length ?? 0) > 0
    updates.push(`onboarding_completed = $${updates.length + 1}`)
    values.push(completed)
    updates.push(`updated_at = NOW()`)

    const query = `
      UPDATE doctors
      SET ${updates.join(", ")}
      WHERE id = $${values.length + 1}
      RETURNING id, email, first_name, last_name, specialty, country, city, timezone, languages, bio,
                consultation_mode, availability, onboarding_completed;
    `
    values.push(userId)

    const result = await client.query(query, values)
    if (result.rowCount === 0) {
      const error = new Error("Doctor not found")
      error.status = 404
      throw error
    }
    return result.rows[0]
  } finally {
    client.release()
  }
}

async function getOnboarding(userId) {
  const client = await pool.connect()
  try {
    const result = await client.query(
      "SELECT id, email, first_name, last_name, specialty, country, city, timezone, languages, bio, consultation_mode, availability, onboarding_completed FROM doctors WHERE id=$1",
      [userId]
    )
    if (result.rowCount === 0) {
      const error = new Error("Doctor not found")
      error.status = 404
      throw error
    }
    const doctor = result.rows[0]
    const requiredFieldsMissing = REQUIRED_FIELDS.filter((field) => !doctor[field])
    return { doctor, requiredFieldsMissing }
  } finally {
    client.release()
  }
}

module.exports = { saveOnboarding, getOnboarding }
