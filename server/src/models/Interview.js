import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
  panelist: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  status: { type: String, enum: ["draft", "submitted"], default: "draft" },
  
  // DepEd Competency-Based Criteria (DO 007, s. 2023)
  criteria: [
    {
      label: { type: String, required: true },
      score: { type: Number, default: 0 },
      maxScore: { type: Number, required: true },
      remarks: String
    }
  ],
  
  totalScore: { type: Number, default: 0 },
  overallRemarks: String,
  submittedAt: Date
}, { timestamps: true });

interviewSchema.pre("save", function(next) {
  this.totalScore = this.criteria.reduce((acc, curr) => acc + (curr.score || 0), 0);
  next();
});

export default mongoose.model("Interview", interviewSchema);
