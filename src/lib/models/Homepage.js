import mongoose from "mongoose";

const HomepageSchema = new mongoose.Schema(
  {
    greeting: { type: String, required: true, default: "Welcome!" },
    description: {
      type: String,
      required: true,
      default: "The Rasul (SAW)'s teachings",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Homepage ||
  mongoose.model("Homepage", HomepageSchema);
