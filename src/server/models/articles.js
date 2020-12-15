import { Schema } from "mongoose"
import connection from "./connection"

const articleSchema = new Schema(
  {
    organization_id: { type: Schema.Types.ObjectId },
    photos: { type: [String] },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    likes: { type: Number },
    is_liked: { type: Boolean },
  },
  {
    collection: "articles",
    timestamps: true,
    strict: true,
  }
)

articleSchema.index({ title: true })

export default connection.model("Article", articleSchema)
