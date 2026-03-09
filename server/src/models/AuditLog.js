import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  action: { 
    type: String, 
    required: true, 
    index: true 
  },
  actor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true
  },
  entityModel: { 
    type: String, 
    required: true,
    enum: ["Application", "Interview", "Job", "CAL", "User", "Role"],
    index: true
  },
  entityId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    index: true
  },
  // Stores the changed fields only for efficiency
  diff: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  severity: { 
    type: String, 
    enum: ["low", "medium", "high", "critical"], 
    default: "low" 
  },
  ipAddress: String,
  userAgent: String,
  description: String,
}, { timestamps: true });

// Ensure logs are immutable at the application level
auditLogSchema.pre("save", async function() {
  if (!this.isNew) {
    throw new Error("Audit logs are immutable and cannot be modified.");
  }
});

export default mongoose.model("AuditLog", auditLogSchema);
