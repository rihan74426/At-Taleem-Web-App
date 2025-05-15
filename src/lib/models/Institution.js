import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    head: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    facultyCount: { type: Number, default: 0 },
    // you could also embed courses, etc.
  },
  { _id: false }
);

const InstitutionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true, trim: true },
    code: { type: String, unique: true, uppercase: true, index: true },
    description: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    logoUrl: { type: String },
    address: { type: String, required: true },
    departments: { type: [DepartmentSchema], default: [] },
    admissionStatus: { type: Boolean, default: false },
    admissionPeriod: {
      openDate: { type: Date },
      closeDate: { type: Date },
    },
    addmisionLink: { type: String },
    interestedEmails: { type: [String], default: [] },
    studentCount: { type: Number, default: 0 },
    establishedAt: { type: Date },
    social: {
      facebook: { type: String },
      twitter: { type: String },
      instagram: { type: String },
      linkedin: { type: String },
      youtube: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Example virtual: full address string
InstitutionSchema.virtual("fullAddress").get(function () {
  const a = this.address;
  return `${a.street}, ${a.city}${a.state ? ", " + a.state : ""}, ${a.country}`;
});

export default mongoose.models.Institution ||
  mongoose.model("Institution", InstitutionSchema);
