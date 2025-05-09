import mongoose from "mongoose";

const InstitutionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    username: { type: String },
    email: { type: String },
    address: { type: String },
    studentCount: { type: Number },
    Departments: { type: [String] },
    admissionStatus: { type: Boolean, default: "false" },
  },
  { timestamps: true }
);

export default mongoose.models.Institution ||
  mongoose.model("Question", InstitutionSchema);
