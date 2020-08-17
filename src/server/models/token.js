import { Schema } from "mongoose";
import connection from "../db";

const userSchema = new Schema(
  {
    token: { type: String, trim: true, unique: true },
  },
  {
    collection: "expired-tokens",
    timestamps: true,
    strict: true,
  }
);

userSchema.index(
  { createdAt: true },
  { expires: process.env.TOKEN_EXPIRATION_PERIOD }
);

export default connection.model("ExpiredTokens", userSchema);
