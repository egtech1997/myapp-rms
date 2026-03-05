import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    applicationCode: { type: String, unique: true, index: true },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submittedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    category: {
      type: String,
      enum: ["teaching", "teaching_related", "non_teaching"],
      required: true,
    },

    // 🔒 Master Lock: Unlimited edits allowed UNTIL this is true
    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    /**
     * SECTION A: APPLICANT DATA (Snapshot from Profile)
     * These fields are filled from the Profile model but stored here.
     */
    applicantData: {
      personalInfo: { type: mongoose.Schema.Types.Mixed },
      education: [
        {
          level: {
            type: String,
            enum: ["Vocational", "Bachelor", "Masteral", "Doctorate"],
          },
          degree: String,
          units: Number,
          school: String,
          yearGraduated: Number,
        },
      ],
      training: [
        {
          title: String,
          hours: Number,
          dateIssued: Date,
          provider: String,
        },
      ],
      experience: [
        {
          position: String,
          company: String,
          months: Number,
          isGovernment: { type: Boolean, default: false },
        },
      ],
      performanceRating: {
        score: Number, // e.g., 4.500
        adjective: String, // e.g., "Very Satisfactory"
        periodCovered: String,
      },
    },

    /**
     * SECTION B: HR RATING (Point System - DepEd MSP)
     */
    hrRating: {
      educationPoints: { type: Number, default: 0 },
      trainingPoints: { type: Number, default: 0 }, // Only last 5 years
      experiencePoints: { type: Number, default: 0 },
      performancePoints: { type: Number, default: 0 }, // Recent 1 year
      outstandingAccomplishments: { type: Number, default: 0 },
      appEducationPoints: { type: Number, default: 0 },
      appLearningPoints: { type: Number, default: 0 },
      potentialPoints: {
        writtenTest: { type: Number, default: 0 },
        bei: { type: Number, default: 0 }, // Behavioral Event Interview
        workSample: { type: Number, default: 0 },
      },
      remarks: String,
    },

    totalScore: { type: Number, default: 0 },
    status: {
      type: String,
      enum: [
        "applied",
        "verifying",
        "comparative_assessment",
        "ranked",
        "disqualified",
      ],
      default: "applied",
    },
    isQualified: { type: Boolean, default: true },
    disqualificationReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/**
 * 🔹 AUTO-INCREMENT CODE: APP-YYYY-0001 (Per Job)
 */
applicationSchema.pre("save", async function (next) {
  if (this.isNew && !this.applicationCode) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("Application").countDocuments({
      submittedTo: this.submittedTo,
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lte: new Date(year, 11, 31, 23, 59, 59),
      },
    });
    this.applicationCode = `APP-${year}-${String(count + 1).padStart(4, "0")}`;
  }

  // 🔹 AUTO-CALCULATE TOTAL SCORE
  const r = this.hrRating;
  this.totalScore =
    r.educationPoints +
    r.trainingPoints +
    r.experiencePoints +
    r.performancePoints +
    r.outstandingAccomplishments +
    r.appEducationPoints +
    r.appLearningPoints +
    (r.potentialPoints?.writtenTest || 0) +
    (r.potentialPoints?.bei || 0) +
    (r.potentialPoints?.workSample || 0);

  next();
});

export default mongoose.model("Application", applicationSchema);
