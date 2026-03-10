import mongoose from "mongoose";

const rubricSchema = new mongoose.Schema({
  // e.g. "teaching", "non_teaching", "teaching_related", "school_admin"
  category: { type: String, required: true, unique: true },
  title: String,
  description: String,
  
  // Array of criteria based on DepEd DO 007, s. 2023
  criteria: [
    {
      key: String,       // technical key for data storage
      label: String,     // display label
      maxPoints: Number,
      isPotential: { type: Boolean, default: false } // Part B vs Part A
    }
  ],
  
  totalPoints: { type: Number, default: 100 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Rubric", rubricSchema);
