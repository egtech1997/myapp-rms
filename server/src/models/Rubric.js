import mongoose from "mongoose";

const rubricSchema = new mongoose.Schema({
  // e.g. "teaching", "non_teaching", "related_teaching"
  track: { type: String, required: true, unique: true },
  
  // Title for display (e.g. "DepEd Order No. 007, s. 2023 - Non-Teaching")
  title: { type: String, required: true },
  
  // The criteria blocks
  criteria: [
    {
      key: { type: String, required: true }, // e.g. "education", "experience"
      label: { type: String, required: true },
      maxPoints: { type: Number, required: true },
      
      // Optional: sub-criteria for things like "Demo Teaching"
      subCriteria: [
        {
          key: String,
          label: String,
          maxPoints: Number
        }
      ]
    }
  ],
  
  // Total must sum to 100 usually
  totalPoints: { type: Number, default: 100 },
  active: { type: Boolean, default: true }
});

export default mongoose.model("Rubric", rubricSchema);
