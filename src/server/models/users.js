import { Schema } from "mongoose";
import connection from "../db";

const userSchema = new Schema(
  {
    username: { type: String, trim: true, required: true },
    full_name: { type: String, trim: true, required: true },
    sex: { type: String, trim: true, enum: ["male", "female", "unknown"] },
    birth: { type: Date },
    email: { type: String, trim: true, required: false },
    tel: { type: String },
    checked: { type: Boolean, default: false },
    location: { type: { type: String }, coordinates: [Number] },
    role: {
      type: String,
      required: true,
      enum: ["user", "admin", "moderator"],
    },
  },
  {
    collection: "users",
    timestamps: true,
    strict: true,
  }
);

export default connection.model("User", userSchema);
