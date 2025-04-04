import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
  {
    entityId: { type: String, required: true }, // Can be a videoId or questionId
    commentType: { type: String, enum: ["video", "question"], required: true }, // Defines type
    userId: { type: String, required: true },
    username: { type: String, required: true },
    content: { type: String, required: true },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    likes: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.Comment ||
  mongoose.model("Comment", CommentSchema);
