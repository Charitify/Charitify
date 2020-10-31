import { Schema } from "mongoose";
import connection from "./connection";

const articleSchema = new Schema(
  {
    photos: { type: [String] },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    likes: { type: Number },
    is_liked: { type: Boolean },
    created_at: { type: Date },
    updated_at: { type: Date },
  },
  {
    collection: "articles",
    timestamps: true,
    strict: true,
  }
);

articleSchema.index({ title: true });

export default connection.model("Article", articleSchema);
