import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
  title:   { type: String, required: true, trim: true },
  content: { type: String, required: true },

  // ── Type (DepEd-specific) ────────────────────────────────────────────────
  type: {
    type: String,
    enum: [
      "general",
      "interview_schedule",   // Schedule of BEI / Panel Interview
      "results",              // IER, RQA, Final Rankings
      "memorandum",           // DepEd Memorandum / DO
      "event",                // General event / activity
      "award",                // Award / Accreditation / Achievement
      "policy",               // Policy / Guidelines
      "training",             // Training / Seminar / Induction
      "system",               // System update
      "ier_release",          // Legacy — kept for compatibility
      "rqa_release",          // Legacy — kept for compatibility
      "job_update",           // Legacy — kept for compatibility
    ],
    default: "general",
  },

  // ── Optional link to a job posting ─────────────────────────────────────
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },

  // ── Schedule metadata (for interview_schedule / event types) ────────────
  scheduledDate: Date,
  scheduledTime: { type: String, trim: true }, // e.g. "09:00 AM – 12:00 PM"
  venue:         { type: String, trim: true }, // e.g. "SDO Conference Room"

  // ── Media ────────────────────────────────────────────────────────────────
  image: { type: String }, // Banner image URL

  // ── File attachments (PDF, Word, Excel, images) ──────────────────────────
  attachments: [{
    fileName: String,
    fileUrl:  String,
    fileType: { type: String, enum: ["pdf", "word", "excel", "image", "other"], default: "other" },
    fileSize: Number, // bytes
  }],

  // ── Publishing ───────────────────────────────────────────────────────────
  postedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status:     { type: String, enum: ["draft", "published"], default: "published" },
  expiryDate: Date,

}, { timestamps: true });

export default mongoose.model("Announcement", announcementSchema);
