// src/lib/models/Video.js
import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    videoUrl: { type: String, required: true }, // Original URL
    platform: { type: String, enum: ["YouTube", "Facebook"], required: true },
    category: { type: String, enum: ["Taleem", "Juma"], required: true },
    recordingDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Videos || mongoose.model("Videos", VideoSchema);
