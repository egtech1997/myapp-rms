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

    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    verificationChecklist: {
      education:   { checked: { type: Boolean, default: false }, note: { type: String, default: "" } },
      training:    { checked: { type: Boolean, default: false }, note: { type: String, default: "" } },
      experience:  { checked: { type: Boolean, default: false }, note: { type: String, default: "" } },
      eligibility: { checked: { type: Boolean, default: false }, note: { type: String, default: "" } },
      performance: { checked: { type: Boolean, default: false }, note: { type: String, default: "" } },
    },

    applicantData: {
      personalInfo: { type: mongoose.Schema.Types.Mixed },
      education: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId },
          level: String,
          school: String,
          degree: String,
          periodFrom: String,
          periodTo: String,
          status: String,
          unitsEarned: String,
          yearGraduated: String,
          honorsReceived: String,
          diploma: String,
          tor: String,
          isRelevant: { type: Boolean, default: true },
          auditRemarks: { type: String, default: "" },
          auditedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
      ],
      eligibility: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId },
          type: String,
          name: String,
          rating: String,
          dateOfExam: Date,
          placeOfExam: String,
          licenseNumber: String,
          licenseValidity: Date,
          document: String,
          isRelevant: { type: Boolean, default: true },
          auditRemarks: { type: String, default: "" },
          auditedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
      ],
      training: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId },
          title: String,
          dateIssued: Date,
          hours: Number,
          typeOfLD: String,
          provider: String,
          document: String,
          isRelevant: { type: Boolean, default: true },
          auditRemarks: { type: String, default: "" },
          auditedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
      ],
      experience: [
        {
          _id: { type: mongoose.Schema.Types.ObjectId },
          periodFrom: Date,
          periodTo: Date,
          position: String,
          company: String,
          monthlySalary: Number,
          salaryGrade: String,
          statusOfAppointment: String,
          isGovernment: Boolean,
          keyResponsibilities: [String],
          document: String,
          isRelevant: { type: Boolean, default: true },
          auditRemarks: { type: String, default: "" },
          auditedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
      ],
      performanceRating: { type: mongoose.Schema.Types.Mixed },
    },

    hrRating: { type: mongoose.Schema.Types.Mixed, default: {} },

    isEvaluated: { type: Boolean, default: false },
    evaluatedAt: Date,
    evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

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
    attachments: [
      {
        type: { type: String, enum: ["transcript", "diploma", "eligibility", "training", "experience", "pds_signed", "id_proof", "service_record", "training_cert"] },
        fileUrl: String,
        fileName: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    submissionDocs: {
      pds:                        { fileUrl: String, fileName: String, uploadedAt: Date },
      applicationLetter:          { fileUrl: String, fileName: String, uploadedAt: Date },
      performanceRatingDoc:       { fileUrl: String, fileName: String, uploadedAt: Date },
      latestAppointment:          { fileUrl: String, fileName: String, uploadedAt: Date },
      workExperienceSheet:        { fileUrl: String, fileName: String, uploadedAt: Date },
      outstandingAccomplishments: [{ fileUrl: String, fileName: String, uploadedAt: { type: Date, default: Date.now } }],
      movs:                       [{ fileUrl: String, fileName: String, uploadedAt: { type: Date, default: Date.now } }],
      research:                   { fileUrl: String, fileName: String, uploadedAt: Date },
      awards:                     [{ fileUrl: String, fileName: String, uploadedAt: { type: Date, default: Date.now } }],
      others:                     [{ fileUrl: String, fileName: String, uploadedAt: { type: Date, default: Date.now } }],
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

// ── Indexes ───────────────────────────────────────────────────────────────────
applicationSchema.index({ submittedBy: 1 });                  // "my applications" query
applicationSchema.index({ submittedTo: 1 });                  // applicants per job query
applicationSchema.index({ submittedTo: 1, status: 1 });       // filter applicants by status
applicationSchema.index({ status: 1 });                       // analytics/dashboard queries
applicationSchema.index({ createdAt: -1 });                   // recent applications

applicationSchema.pre("save", async function () {
  if (this.isNew && !this.applicationCode) {
    const jobSuffix = this.submittedTo.toString().slice(-4).toUpperCase();
    const count = await mongoose.model("Application").countDocuments({
      submittedTo: this.submittedTo,
    });
    this.applicationCode = `APP-${jobSuffix}-${String(count + 1).padStart(4, "0")}`;
  }

  if (this.hrRating) {
    let sum = 0;
    const recursiveSum = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === "number") {
          sum += obj[key];
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          recursiveSum(obj[key]);
        }
      }
    };
    recursiveSum(this.hrRating);
    this.totalScore = sum;
  }
});

export default mongoose.model("Application", applicationSchema);
