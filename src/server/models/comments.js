import { Schema } from "mongoose"
import connection from "./connection"

const commentSchema = new Schema(
  {
    organization_id: { type: Schema.Types.ObjectId },
    fund_id: { type: Schema.Types.ObjectId },
    name: { type: String, trim: true },
    avatar: { type: String, trim: true },
    likes: { type: Number },
    is_liked: { type: Boolean },
    content: { type: String, trim: true },
  },
  {
    collection: "comments",
    timestamps: true,
    strict: true,
  }
)

commentSchema.index({ name: true })

export default connection.model("Comment", commentSchema)
