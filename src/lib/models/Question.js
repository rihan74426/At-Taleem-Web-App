import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String }, // Optional: category or tags
    // For the asker – if anonymous, email is stored instead of a userId
    userId: { type: String }, // Optional: if logged in
    username: { type: String, default: "Anonymous" },
    email: { type: String }, // Required if asked anonymously
    status: { type: String, enum: ["pending", "answered"], default: "pending" },
    answer: { type: String },
    answeredAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Question ||
  mongoose.model("Question", QuestionSchema);
