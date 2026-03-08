import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application",
    required: true,
    index: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["transcript", "diploma", "training_cert", "service_record", "eligibility_cert", "id_proof", "pds_signed"],
    required: true
  },
  fileName: String,
  fileUrl: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending"
  },
  verificationDetails: {
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: Date,
    remarks: String
  },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

export default mongoose.model("Document", documentSchema);
