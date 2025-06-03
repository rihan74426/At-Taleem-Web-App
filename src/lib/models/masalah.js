// lib/models/Masalah.js
import mongoose from "mongoose";

const MasalahSchema = new mongoose.Schema(
  {
    // Short title or identifier for the issue
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Full description of the Masalah
    description: {
      type: String,
      required: true,
      trim: true,
    },

    references: {
      type: String,
      required: true,
      trim: true,
    },

    // Users who “liked” or “upvoted” this Masalah (array of Clerk / Auth0 / custom user IDs)
    likers: [
      {
        type: String,
        index: true,
      },
    ],

    // Comments on this Masalah (referring to your existing Comment schema)
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Virtual: number of likes
MasalahSchema.virtual("likeCount").get(function () {
  return Array.isArray(this.likers) ? this.likers.length : 0;
});

// Virtual: number of comments
MasalahSchema.virtual("commentCount").get(function () {
  return Array.isArray(this.comments) ? this.comments.length : 0;
});

// Instance method for toggling a like
MasalahSchema.methods.toggleLike = function (userId) {
  const idx = this.likers.indexOf(userId);
  if (idx === -1) {
    this.likers.push(userId);
  } else {
    this.likers.splice(idx, 1);
  }
  return this.save();
};

// Static helper to fetch a Masalah along with its comments populated
MasalahSchema.statics.findWithComments = function (masalahId) {
  return this.findById(masalahId).populate({
    path: "comments",
    options: { sort: { createdAt: -1 } }, // latest first
  });
};

export default mongoose.models.Masalah ||
  mongoose.model("Masalah", MasalahSchema);
