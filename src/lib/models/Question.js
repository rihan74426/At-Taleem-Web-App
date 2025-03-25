import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    userId: { type: String },
    username: { type: String },
    isAnonymous: { type: Boolean, default: false },
    email: { type: String },
    status: { type: String, enum: ["pending", "answered"], default: "pending" },
    answer: { type: String },
    answeredAt: { type: Date },
    helpfulCount: { type: Number, default: 0 }, // Track helpful votes
  },
  { timestamps: true }
);

export default mongoose.models.Question ||
  mongoose.model("Question", QuestionSchema);
