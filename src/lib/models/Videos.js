// src/lib/models/Video.js
import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    videoUrl: { type: String, required: true }, // Original URL
    embedCode: { type: String }, // For Facebook embed code (if provided)
    platform: { type: String, enum: ["YouTube", "Facebook"], required: true },
    category: { type: String, enum: ["Taleem", "Juma"], required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Videos || mongoose.model("Videos", VideoSchema);
