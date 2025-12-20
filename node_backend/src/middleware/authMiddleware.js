const jwt = require("jsonwebtoken")

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || ""
  const [, token] = header.split(" ")
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" })
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret")
    req.user = payload
    return next()
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" })
  }
}

module.exports = { authMiddleware }
