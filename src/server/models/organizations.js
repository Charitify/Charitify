import { Schema } from "mongoose";
import connection from "./connection";

const organizationSchema = new Schema(
  {
    name: { type: String, trim: true },
    is_liked: { type: Boolean },
    likes: { type: Number },
    views: { type: Number },
    created_at: { type: Date },
    updated_at: { type: Date },
    avatar: { type: String },
    avatar_big: { type: String },
    title: { type: String, trim: true },
    subtitle: { type: String, trim: true },
    description: { type: String, trim: true },
    need_sum: { type: Number },
    curremt_sum: { type: Number },
    currencyId: { type: String },
  },
  {
    collection: "organizations",
    timestamps: true,
    strict: true,
  }
);

organizationSchema.index({ name: true });

export default connection.model("Organization", organizationSchema);
