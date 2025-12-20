const jwt = require("jsonwebtoken")
const { supabase, supabaseForToken } = require("../config/supabase")

async function conversationAuth(req, res, next) {
  const header = req.headers.authorization || ""
  const [, token] = header.split(" ")
  if (!token) {
    return res.status(401).json({ success: false, message: "Missing bearer token" })
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret")
    req.actor = { type: "doctor", doctorId: decoded.id, token }
    return next()
  } catch (err) {
    // try patient token (Supabase)
  }
  try {
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user?.id) {
      return res.status(401).json({ success: false, message: "Invalid token" })
    }
    const userId = data.user.id
    req.actor = { type: "patient", patientExternalId: userId, token, supabase: supabaseForToken(token) }
    return next()
  } catch (err) {
    return res.status(401).json({ success: false, message: "Unauthorized" })
  }
}

module.exports = { conversationAuth }
