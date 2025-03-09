import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    platform: { type: String, enum: ["YouTube", "Facebook"], required: true },
    videoUrl: { type: String, required: true },
    category: { type: String, enum: ["Taleem", "Juma"], required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Video || mongoose.model("Video", VideoSchema);
