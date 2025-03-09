import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
  {
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Videos",
      required: true,
    },
    userId: { type: String, required: true }, // Or a reference to your User model if applicable
    username: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Comment ||
  mongoose.model("Comment", CommentSchema);
