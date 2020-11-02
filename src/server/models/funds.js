import { Schema } from "mongoose";
import connection from "./connection";

const fundSchema = new Schema(
  {
    name: { type: String, trim: true },
    logo: { type: String, trim: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    content: { type: String, trim: true },
    photos: { type: [String] },
    views: { type: Number },
    likes: { type: Number },
    is_liked: { type: Boolean },
    documents: { type: [String] },
    videos: { type: [String] },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    location: {
      lat: Number,
      lng: Number,
      city: String,
      country: String,
      address: String,
      map: String,
    },
    telegram: { type: String, trim: true },
    facebook: { type: String, trim: true },
    viber: { type: String, trim: true },
    how_to_help: { type: String, trim: true },
    current_sum: { type: Number },
    needed_sum: { type: Number },
    created_at: { type: Date },
    updated_at: { type: Date },
  },
  {
    collection: "funds",
    timestamps: true,
    strict: true,
  }
);

fundSchema.index({ name: true });

export default connection.model("Fund", fundSchema);
