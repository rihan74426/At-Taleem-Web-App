// lib/models/Activity.js
import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    scope: {
      type: String,
      enum: ["weekly", "monthly", "yearly"],
      required: true,
    },
    startDate: { type: Date, required: true },
    scheduledTime: { type: Date }, // exact moment to auto‑complete
    seriesIndex: { type: Number, default: 1 },
    createdBy: { type: String }, // admin userId

    // New fields:
    interestedPersons: [{ type: String }], // userIds who clicked “interested”
    notificationWants: [{ type: String }], // userIds who want notifications for this scope

    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Activity ||
  mongoose.model("Activity", ActivitySchema);
