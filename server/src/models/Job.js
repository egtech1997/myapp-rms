import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    positionTitle: { type: String, required: true, trim: true },
    positionCode: {
      type: String,
      required: true,
      uppercase: true,
    },
    description: { type: String, default: "" },

    // 🔹 DepEd Qualification Standards (QS) - DO 007, s. 2023
    qualifications: {
      education: { type: String, default: "" },
      experience: { type: String, default: "" },
      minExperienceMonths: { type: Number, default: 0 },
      trainings: { type: String, default: "" },
      minTrainingHours: { type: Number, default: 0 },
      eligibility: [String],
      competencyRequirements: [String],
    },

    // Plantilla / Item details
    itemNumbers: [String],
    salary: { type: Number, required: true },
    salaryGrade: { type: Number, required: true },
    noOfVacancy: { type: Number, default: 1 },

    placeOfAssignment: [String],

    // 🔹 Employment Type (What you currently have)
    employmentType: {
      type: String,
      enum: ["permanent", "contractual", "job order", "casual"],
      default: "permanent",
    },

    // 🔹 Hiring Track (Essential for the DepEd Rater Flow)
    hiringTrack: {
      type: String,
      enum: ["teaching", "teaching_related", "non_teaching"],
      required: true,
    },

    applications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application",
      },
    ],

    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["draft", "published", "closed", "archived"],
      default: "draft",
    },

    deadline: { type: Date },
    hideVacancyCount:     { type: Boolean, default: false },
    finalIerReleasedAt:   { type: Date,    default: null },
    finalIerReleasedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

// 🔹 Sync Vacancy count based on Item Numbers
jobSchema.pre("save", async function () {
  if (this.itemNumbers) {
    this.noOfVacancy = this.itemNumbers.length;
  }
});

export default mongoose.model("Job", jobSchema);
