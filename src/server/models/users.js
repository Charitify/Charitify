import { Schema } from "mongoose";
import connection from "../db";
import { userSexEnum, userRolesEnum } from "../config";

const userSchema = new Schema(
  {
    username: { type: String, trim: true, required: true, unique: true },
    fullname: { type: String, trim: true, required: true },
    sex: { type: String, trim: true, enum: userSexEnum },
    birthDate: { type: Date },
    email: { type: String, trim: true, required: false, unique: true },
    tel: { type: String },
    checked: { type: Boolean, default: false },
    location: { type: { type: String }, coordinates: [Number] },
    role: {
      type: String,
      required: true,
      enum: userRolesEnum,
    },
    hash: { type: String, select: false },
    salt: { type: String, select: false },
  },
  {
    collection: "users",
    timestamps: true,
    strict: true,
  }
);

userSchema.index({ email: true }, { unique: true });
userSchema.index({ username: true }, { unique: true });

export default connection.model("User", userSchema);
