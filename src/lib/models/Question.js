import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    userId: {
      type: String,
      required: false,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "answered"],
      default: "pending",
    },
    answer: {
      type: String,
      default: null,
    },
    answeredAt: {
      type: Date,
      default: null,
    },
    helpfulVotes: [
      {
        type: String, // User IDs who found this helpful
      },
    ],
    bookmarks: [
      {
        type: String, // User IDs who bookmarked this
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
questionSchema.index({ title: "text", description: "text" });
questionSchema.index({ status: 1, createdAt: -1 });
questionSchema.index({ category: 1 });
questionSchema.index({ userId: 1 });
questionSchema.index({ "helpfulVotes.length": -1 });
questionSchema.index({ "bookmarks.length": -1 });

const Question =
  mongoose.models.Question || mongoose.model("Question", questionSchema);

export default Question;
