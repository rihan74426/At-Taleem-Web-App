import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    scope: {
      type: String,
      enum: ["weekly", "monthly", "yearly"],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date }, // optional end
    scheduledTime: { type: Date }, // for auto-complete/job trigger
    seriesIndex: { type: Number, default: 1 },

    createdBy: { type: String, required: true }, // admin userId
    interestedUsers: [{ type: String }], // clicked “interested”
    notificationWants: [{ type: String }], // prefetched at creation
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Activity ||
  mongoose.model("Activity", ActivitySchema);
