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

    // ── Verification Checklist (HR vs Physical Copies) ──
    verificationChecklist: {
      education:   { checked: { type: Boolean, default: false }, note: { type: String, default: "" } },
      training:    { checked: { type: Boolean, default: false }, note: { type: String, default: "" } },
      experience:  { checked: { type: Boolean, default: false }, note: { type: String, default: "" } },
      eligibility: { checked: { type: Boolean, default: false }, note: { type: String, default: "" } },
      performance: { checked: { type: Boolean, default: false }, note: { type: String, default: "" } },
    },

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
            enum: ["Elementary", "Secondary", "Vocational", "Bachelor", "Masteral", "Doctorate"],
          },
          degree: String,
          school: String,
          periodFrom: String,
          periodTo: String,
          unitsEarned: Number,
          yearGraduated: Number,
          honorsReceived: String,
        },
      ],
      eligibility: [
        {
          name: { type: String, trim: true },
          rating: { type: String, trim: true },
          dateOfExam: Date,
          placeOfExam: { type: String, trim: true },
          licenseNumber: String,
          licenseValidity: Date,
        },
      ],
      training: [
        {
          title: { type: String, required: true },
          periodFrom: Date,
          periodTo: Date,
          hours: { type: Number, required: true },
          typeOfLD: String,
          provider: String,
        },
      ],
      experience: [
        {
          periodFrom: { type: Date, required: true },
          periodTo: Date,
          position: { type: String, required: true },
          company: { type: String, required: true },
          monthlySalary: Number,
          salaryGrade: String,
          statusOfAppointment: String,
          isGovernment: { type: Boolean, default: false },
        },
      ],
      competencies: [{ type: String }],
      performanceRating: {
        score: Number,
        adjective: String,
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

    // ── Evaluation (HR Rating phase, post-verification) ──
    isEvaluated: { type: Boolean, default: false },
    evaluatedAt: Date,
    evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Per-item relevance flags set by the rater during evaluation
    itemRelevance: {
      education:   [{ index: Number, isRelevant: { type: Boolean, default: true }, note: { type: String, default: "" } }],
      eligibility: [{ index: Number, isRelevant: { type: Boolean, default: true }, note: { type: String, default: "" } }],
      training:    [{ index: Number, isRelevant: { type: Boolean, default: true }, note: { type: String, default: "" } }],
      experience:  [{ index: Number, isRelevant: { type: Boolean, default: true }, note: { type: String, default: "" } }],
      performance: { isRelevant: { type: Boolean, default: true }, note: { type: String, default: "" } },
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
        "appointed",
      ],
      default: "applied",
    },
    appointmentData: {
      dateAppointed: Date,
      effectiveDate: Date,
      itemNumber: String,
      remarks: String,
    },
    // 📂 ATTACHMENTS (Proofs for verification)
    attachments: [
      {
        type: { type: String, enum: ["transcript", "diploma", "eligibility", "training", "experience", "pds_signed", "id_proof"] },
        fileUrl: String,
        fileName: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
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
 * 🔹 AUTO-INCREMENT CODE: APP-POSITIONCODE-<jobId4>-0001
 * jobId4 = last 4 hex chars of the job's _id, ensuring uniqueness
 * even when the same positionCode is reused across different job postings.
 */
// AUTO-CALCULATE TOTAL SCORE (Weighted based on Rubric)
applicationSchema.pre("save", async function () {
  if (this.isNew && !this.applicationCode) {
    const jobSuffix = this.submittedTo.toString().slice(-4).toUpperCase();
    const count = await mongoose.model("Application").countDocuments({
      submittedTo: this.submittedTo,
    });
    this.applicationCode = `APP-${jobSuffix}-${String(count + 1).padStart(4, "0")}`;
  }

  // Only calculate score if it's being evaluated
  if (this.hrRating) {
    const r = this.hrRating;
    this.totalScore =
      (r.educationPoints || 0) +
      (r.trainingPoints || 0) +
      (r.experiencePoints || 0) +
      (r.performancePoints || 0) +
      (r.outstandingAccomplishments || 0) +
      (r.appEducationPoints || 0) +
      (r.appLearningPoints || 0) +
      (r.potentialPoints?.writtenTest || 0) +
      (r.potentialPoints?.bei || 0) +
      (r.potentialPoints?.workSample || 0);
  }
});

// 🛡️ DEEP SEARCH INDEX
applicationSchema.index({
  "applicantData.personalInfo.firstName": "text",
  "applicantData.personalInfo.lastName": "text",
  "applicantData.education.degree": "text",
  "applicantData.education.school": "text",
  "applicantData.experience.position": "text",
  "applicantData.experience.company": "text",
  "applicantData.eligibility.name": "text",
  "applicationCode": "text"
}, {
  weights: {
    "applicantData.personalInfo.lastName": 10,
    "applicationCode": 10,
    "applicantData.education.degree": 5,
    "applicantData.experience.position": 3
  },
  name: "DeepSearchIndex"
});

export default mongoose.model("Application", applicationSchema);
