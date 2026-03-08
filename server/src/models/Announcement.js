import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["general", "job_update", "ier_release", "rqa_release"], 
    default: "general" 
  },
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job" }, // Optional link to a job
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["draft", "published"], default: "published" },
  expiryDate: Date,
  attachments: [{
    fileName: String,
    fileUrl: String
  }]
}, { timestamps: true });

export default mongoose.model("Announcement", announcementSchema);
