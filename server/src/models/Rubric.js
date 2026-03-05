import mongoose from "mongoose";

const rubricSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ["teaching", "teaching_related", "non_teaching"],
    unique: true,
  },
  weights: {
    education: { type: Number, default: 0 },
    training: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    performance: { type: Number, default: 0 },
    outstandingAccomplishments: { type: Number, default: 0 },
    appEducation: { type: Number, default: 0 },
    appLearning: { type: Number, default: 0 },
    potential: {
      writtenTest: { type: Number, default: 0 },
      bei: { type: Number, default: 0 },
      workSample: { type: Number, default: 0 },
    },
  },
  active: { type: Boolean, default: true },
});

export default mongoose.model("Rubric", rubricSchema);
