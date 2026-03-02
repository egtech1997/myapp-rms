import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    // Unique application code
    applicationCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Snapshot of personal information at time of application
    personalInfo: {
      firstName: { type: String, required: true, trim: true },
      middleName: { type: String, trim: true },
      lastName: { type: String, required: true, trim: true },
      suffix: { type: String, trim: true },
      sex: { type: String, enum: ["male", "female", "prefer_not_to_say"] },
      birthDate: Date, // age can be derived
      civilStatus: String,
      religion: String,
      disability: String,
      ethnicGroup: String,
      emails: [String],
      contacts: [String],
      address: {
        sitio: String,
        barangay: String,
        municipality: String,
        city: String,
        province: String,
        region: String,
        zipCode: String,
      },
      eligibility: [String],
      visibility: {
        // privacy flags
        showEmail: { type: Boolean, default: false },
        showPhone: { type: Boolean, default: false },
        showAddress: { type: Boolean, default: false },
      },
    },

    // Education, Training, Experience arrays
    education: [
      {
        title: String,
        units: Number,
        school: String,
        yearGraduated: Number,
      },
    ],

    training: [
      {
        title: String,
        dateIssued: Date,
        hours: Number,
        provider: String,
      },
    ],

    experience: [
      {
        title: String,
        months: Number,
        company: String,
        responsibilities: String,
      },
    ],

    // Job/application references
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    submittedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    // Status flow
    status: {
      type: String,
      enum: [
        "applied",
        "reviewing",
        "rated",
        "ranked",
        "disqualified",
        "hired",
      ],
      default: "applied",
      index: true,
    },

    // Reviews by HR
    review: [
      {
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now },
        qualified: Boolean,
        matchedFields: [String], // e.g., skills, experience
        notes: String,
      },
    ],

    // Optional snapshot for audit/logging
    applicantSnapshot: { type: mongoose.Schema.Types.Mixed },

    // Multi-reviewer support (optional for scaling)
    reviewers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        assignedAt: { type: Date, default: Date.now },
        completed: { type: Boolean, default: false },
      },
    ],

    // Soft delete
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Tags for filtering/search
    tags: [String],

    // Derived fields (optional for dashboard)
    totalExperienceMonths: Number,
    skillsMatchScore: Number,
  },
  { timestamps: true },
);

// 🔹 Indexing for performance
applicationSchema.index({ submittedTo: 1, status: 1 });
applicationSchema.index({ submittedBy: 1 });
applicationSchema.index({ applicationCode: 1 }, { unique: true });
applicationSchema.index({
  "personalInfo.lastName": 1,
  "personalInfo.firstName": 1,
});
applicationSchema.index({ "review.reviewedBy": 1, status: 1 });

export default mongoose.model("Application", applicationSchema);
