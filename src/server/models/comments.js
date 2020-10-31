import { Schema } from "mongoose";
import connection from "./connection";

const commentSchema = new Schema(
  {
    name: { type: String, trim: true },
    avatar: { type: String, trim: true },
    likes: { type: Number },
    is_liked: { type: Boolean },
    content: { type: String, trim: true },
    created_at: { type: Date },
    updated_at: { type: Date },
  },
  {
    collection: "comments",
    timestamps: true,
    strict: true,
  }
);

commentSchema.index({ name: true });

export default connection.model("Comment", commentSchema);
