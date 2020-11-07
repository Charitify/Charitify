import { Schema } from "mongoose";
import connection from "./connection";

const petSchema = new Schema(
  {
    fund_id: { type: Schema.Types.ObjectId },
    name: { type: String, trim: true },
    avatar: { type: String, trim: true },
    breed: { type: String, trim: true },
    birth: { type: Date },
    sex: { type: String, trim: true },
    character: { type: String, trim: true },
    character_short: { type: String, trim: true },
    sterelization: { type: Boolean },
    photos: { type: [String] },
    story: [{
      date: Date,
      title: String,
    }],
    vaccines: [String],
    created_at: { type: Date },
    updated_at: { type: Date, default: Date.now },
  },
  {
    collection: "pets",
    timestamps: true,
    strict: true,
  }
);

petSchema.index({ name: true });

export default connection.model("Pet", petSchema);
