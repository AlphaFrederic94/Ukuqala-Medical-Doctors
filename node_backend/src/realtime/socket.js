const { Server } = require("socket.io")
const jwt = require("jsonwebtoken")
const { logger } = require("../utils/logger")

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret"

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
    },
  })

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token
      if (!token) return next(new Error("unauthorized"))
      const decoded = jwt.verify(token, JWT_SECRET)
      socket.user = decoded
      return next()
    } catch (err) {
      return next(new Error("unauthorized"))
    }
  })

  io.on("connection", (socket) => {
    const user = socket.user
    logger.info({ user }, "socket connected")

    socket.on("join", ({ room }) => {
      if (!room) return
      socket.join(room)
      socket.emit("joined", { room })
    })

    socket.on("call-offer", ({ room, offer }) => {
      if (!room || !offer) return
      socket.to(room).emit("call-offer", { offer, from: user.id })
    })

    socket.on("call-answer", ({ room, answer }) => {
      if (!room || !answer) return
      socket.to(room).emit("call-answer", { answer, from: user.id })
    })

    socket.on("ice-candidate", ({ room, candidate }) => {
      if (!room || !candidate) return
      socket.to(room).emit("ice-candidate", { candidate, from: user.id })
    })

    socket.on("call-end", ({ room }) => {
      if (!room) return
      socket.to(room).emit("call-end", { from: user.id })
    })

    socket.on("disconnect", (reason) => {
      logger.info({ user, reason }, "socket disconnected")
    })
  })
}

module.exports = { initSocket }
