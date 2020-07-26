import Logger from "../utils/logger";
import mongoose from "mongoose";

const logger = Logger.child({ namespace: "db-connection" });
console.log(process.env.CONNECTION_URI);

export default mongoose.createConnection(
  process.env.CONNECTION_URI,
  { useNewUrlParser: true },
  (err) => {
    if (err) {
      logger.error("Mongoose connection failed: ", err);
    }
    logger.info("Connected to mondoDB");
    return true;
  }
);
