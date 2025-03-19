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
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    }, // For replies
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }], // Array of reply IDs
    likes: [{ type: String }], // Array of userIds who liked the comment
  },
  { timestamps: true }
);

export default mongoose.models.Comment ||
  mongoose.model("Comment", CommentSchema);
