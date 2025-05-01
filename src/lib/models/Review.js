// models/Review.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    profession: { type: String },
    userProfilePic: { type: String },
    reviewText: { type: String, required: true, maxlength: 2000 },
    likes: { type: [String], default: [] },
    status: {
      // For moderation
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);
export default Review;
