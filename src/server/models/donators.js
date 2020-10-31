import { Schema } from "mongoose";
import connection from "./connection";

const donatorSchema = new Schema(
  {
    name: { type: String, trim: true },
    avatar: { type: String, trim: true },
    amount: { type: Number },
    checked: { type: Boolean },
    created_at: { type: Date },
    updated_at: { type: Date },
  },
  {
    collection: "donators",
    timestamps: true,
    strict: true,
  }
);

donatorSchema.index({ name: true });

export default connection.model("Donator", donatorSchema);
