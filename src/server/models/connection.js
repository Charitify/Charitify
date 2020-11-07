import Logger from "../utils/logger"
import mongoose from "mongoose"

const logger = Logger.child({ namespace: "db-connection" })

export default mongoose.createConnection(
  process.env.CONNECTION_URI,
  {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) {
      logger.error("Mongoose connection failed: ", err)
    }
    logger.info("Connected to Mongo DB")
    return true
  }
)
