const jwt = require("jsonwebtoken")
const { supabase, supabaseForToken } = require("../config/supabase")

/**
 * Accepts either:
 * - Doctor JWT (our backend) -> actorType: doctor, doctorId
 * - Supabase access token (patient) -> actorType: patient, patientExternalId
 */
async function appointmentAuth(req, res, next) {
  const header = req.headers.authorization || ""
  const [, token] = header.split(" ")
  if (!token) {
    return res.status(401).json({ success: false, message: "Missing bearer token" })
  }

  // Try doctor JWT
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret")
    req.actor = { type: "doctor", doctorId: decoded.id, token }
    return next()
  } catch (err) {
    // fall through to patient token attempt
  }

  // Try Supabase access token for patient
  try {
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user?.id) {
      return res.status(401).json({ success: false, message: "Invalid token" })
    }
    const userId = data.user.id
    // bind a supabase client with this token for RLS-safe operations if needed
    req.actor = { type: "patient", patientExternalId: userId, token, supabase: supabaseForToken(token) }
    return next()
  } catch (err) {
    return res.status(401).json({ success: false, message: "Unauthorized" })
  }
}

module.exports = { appointmentAuth }
