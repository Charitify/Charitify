import { createLogger, format, transports } from "winston"
const { combine, timestamp, printf, colorize } = format

const myFormat = printf(({ level, message, timestamp, stack, namespace }) => {
  return `${timestamp} ${namespace || "none"} - [${level}] : ${message} ${
    stack || ""
  }`
})

const logger = createLogger({
  format: combine(colorize(), timestamp(), myFormat),
  transports: [
    new transports.Console({
      silent: process.env.ENV === "test",
    }),
  ],
})

const formatMessage = (text) => {
  return text.substring(0, text.lastIndexOf("\n"))
}

logger.winstonStream = {
  write: function (message, encoding) {
    logger.child({ namespace: "api" }).info(formatMessage(message))
  },
}

export default logger
