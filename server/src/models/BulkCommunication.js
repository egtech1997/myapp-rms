import mongoose from "mongoose";

const bulkCommunicationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  subject: { type: String, required: true },
  content: { type: String, required: true },
  type: {
    type: String,
    enum: ["email", "in_app", "both"],
    default: "both"
  },
  category: {
    type: String,
    enum: ["status_update", "interview_invite", "announcement", "custom"],
    default: "custom"
  },
  recipients: [{
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    error: String,
    sentAt: Date
  }],
  stats: {
    total: { type: Number, default: 0 },
    success: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
  },
  attachments: [{
    fileName: String,
    fileType: String, // e.g., "PDS", "APPOINTMENT"
    referenceId: mongoose.Schema.Types.ObjectId
  }]
}, { timestamps: true });

export default mongoose.model("BulkCommunication", bulkCommunicationSchema);
