const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { v4: uuidv4 } = require("uuid")
const { pool } = require("../config/db")

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret"
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d"

async function signUp({ email, password, firstName, lastName }) {
  const client = await pool.connect()
  try {
    const existing = await client.query("SELECT id FROM doctors WHERE email=$1", [email])
    if (existing.rowCount > 0) {
      const error = new Error("Email already registered")
      error.status = 409
      throw error
    }
    const hash = await bcrypt.hash(password, 10)
    const id = uuidv4()
    const insert = `
      INSERT INTO doctors (id, email, password, first_name, last_name, onboarding_completed)
      VALUES ($1, $2, $3, $4, $5, FALSE)
      RETURNING id, email, first_name, last_name, onboarding_completed
    `
    const result = await client.query(insert, [id, email, hash, firstName, lastName])
    const user = result.rows[0]
    const token = jwt.sign({ id: user.id, email: user.email, role: "doctor" }, JWT_SECRET, { expiresIn: JWT_EXPIRY })
    return { user, token }
  } finally {
    client.release()
  }
}

async function signIn({ email, password }) {
  const client = await pool.connect()
  try {
    const result = await client.query(
      "SELECT id, email, password, first_name, last_name, onboarding_completed FROM doctors WHERE email=$1",
      [email]
    )
    if (result.rowCount === 0) {
      const error = new Error("Invalid email or password")
      error.status = 401
      throw error
    }
    const user = result.rows[0]
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      const error = new Error("Invalid email or password")
      error.status = 401
      throw error
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: "doctor" }, JWT_SECRET, { expiresIn: JWT_EXPIRY })
    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        onboarding_completed: user.onboarding_completed,
      },
      token,
    }
  } finally {
    client.release()
  }
}

async function changePassword({ doctorId, currentPassword, newPassword }) {
  const client = await pool.connect()
  try {
    const result = await client.query("SELECT password FROM doctors WHERE id=$1", [doctorId])
    if (result.rowCount === 0) {
      const error = new Error("Doctor not found")
      error.status = 404
      throw error
    }
    const user = result.rows[0]
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) {
      const error = new Error("Current password is incorrect")
      error.status = 401
      throw error
    }
    const hash = await bcrypt.hash(newPassword, 10)
    await client.query("UPDATE doctors SET password=$1, updated_at=NOW() WHERE id=$2", [hash, doctorId])
    return true
  } finally {
    client.release()
  }
}

module.exports = { signUp, signIn, changePassword }
