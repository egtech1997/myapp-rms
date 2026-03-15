import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["status_update", "interview_invite", "ranking_release", "general"],
    default: "general",
  },
  status: {
    type: String,
    enum: ["unread", "read"],
    default: "unread",
  },
  // Link to relevant application for quick context
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application",
  },
  emailSent: { type: Boolean, default: false },
  emailError: String,
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

// ── Indexes ───────────────────────────────────────────────────────────────────
// Compound index: fetch user's notifications sorted by newest first
notificationSchema.index({ recipient: 1, createdAt: -1 });
// Unread count query
notificationSchema.index({ recipient: 1, status: 1 });
// TTL — auto-delete notifications older than 6 months
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 15552000 });

export default mongoose.model("Notification", notificationSchema);
