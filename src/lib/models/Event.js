import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    scope: {
      type: String,
      enum: ["weekly", "monthly", "yearly"],
      required: true,
      index: true,
    },
    startDate: { type: Date, required: true, index: true },
    scheduledTime: { type: Date, index: true }, // for auto-complete/job trigger
    seriesIndex: { type: Number, default: 1 },
    location: {
      type: String,
      trim: true,
      default: "",
    },

    // User interactions
    createdBy: { type: String, required: true, index: true }, // admin userId
    interestedUsers: [{ type: String, index: true }], // clicked "interested"
    notificationWants: [{ type: String, index: true }], // users who want notifications

    // Event status
    completed: { type: Boolean, default: false, index: true },
    canceled: { type: Boolean, default: false, index: true },
    featured: { type: Boolean, default: false, index: true },

    // Attachments/resources
  },
  {
    timestamps: true,
  }
);

// Method to check if a user can register
EventSchema.methods.canRegister = function () {
  if (this.canceled) return false;
  if (this.completed) return false;
  return true;
};

// Helper to format dates
EventSchema.methods.formatDates = function () {
  return {
    startDate: this.startDate
      ? new Date(this.startDate).toLocaleDateString()
      : null,
    scheduledTime: this.scheduledTime
      ? new Date(this.scheduledTime).toLocaleString()
      : null,
  };
};

const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);

export default Event;
