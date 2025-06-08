// src/lib/models/Video.js
import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot be more than 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot be more than 2000 characters"],
    },
    videoUrl: {
      type: String,
      required: [true, "Video URL is required"],
      trim: true,
    },
    platform: {
      type: String,
      enum: {
        values: ["YouTube", "Facebook"],
        message: "Platform must be either YouTube or Facebook",
      },
      required: [true, "Platform is required"],
    },
    category: {
      type: String,
      enum: {
        values: ["Taleem", "Juma"],
        message: "Category must be either Taleem or Juma",
      },
      required: [true, "Category is required"],
      index: true,
    },
    recordingDate: {
      type: Date,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
      min: [0, "Views cannot be negative"],
    },
    likes: [
      {
        type: String, // User IDs who liked the video
        index: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for frequently queried fields
VideoSchema.index({ createdAt: -1 });
VideoSchema.index({ title: "text", description: "text" });

// Virtual for like count
VideoSchema.virtual("likeCount").get(function () {
  return this.likes ? this.likes.length : 0;
});

// Method to toggle like
VideoSchema.methods.toggleLike = function (userId) {
  const index = this.likes.indexOf(userId);
  if (index === -1) {
    this.likes.push(userId);
  } else {
    this.likes.splice(index, 1);
  }
  return this.save();
};

// Method to increment views
VideoSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

// Static method to find videos by category
VideoSchema.statics.findByCategory = function (category, page = 1, limit = 10) {
  return this.find({
    category,
    status: "active",
  })
    .sort({ recordingDate: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

export default mongoose.models.Videos || mongoose.model("Videos", VideoSchema);
