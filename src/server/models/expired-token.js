import { Schema } from "mongoose"
import connection from "./connection"

const userSchema = new Schema(
  {
    token: { type: String, trim: true, unique: true },
    expires: {
      type: Date,
      expires: `${process.env.TOKEN_EXPIRATION_PERIOD}ms`,
      default: Date.now(),
    },
  },
  {
    collection: "expired-tokens",
    strict: true,
  }
)

export default connection.model("ExpiredTokens", userSchema)
