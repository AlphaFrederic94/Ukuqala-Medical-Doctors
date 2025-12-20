const http = require("http")
const { app, bootstrap } = require("./app")
const { logger } = require("./utils/logger")
const { initSocket } = require("./realtime/socket")

const PORT = process.env.PORT || 8000

bootstrap()
  .then(() => {
    const server = http.createServer(app)
    initSocket(server)
    server.listen(PORT, () => {
      logger.info(`API listening on port ${PORT}`)
    })
  })
  .catch((err) => {
    logger.error({ err }, "Failed to start server")
    process.exit(1)
  })
