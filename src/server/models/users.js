import { Schema } from "mongoose";
import connection from "./connection";
import { userSexEnum, userRolesEnum } from "../config";

const userSchema = new Schema(
  {
    avatar: { type: String, trim: true },
    username: { type: String, trim: true, unique: true },
    fullname: { type: String, trim: true, required: true },
    sex: { type: String, trim: true, enum: userSexEnum },
    birthDate: { type: Date },
    email: { type: String, trim: true, unique: true },
    tel: { type: String },
    checked: { type: Boolean, default: false },
    location: { type: { type: String }, coordinates: [Number] },
    role: {
      type: String,
      required: true,
      enum: userRolesEnum,
    },
    facebook: {
      token: { type: String, select: false },
      id: { type: String },
      photos: [],
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

userSchema.index({ email: true });
userSchema.index({ username: true });

export default connection.model("User", userSchema);
