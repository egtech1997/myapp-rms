import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  application: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Application", 
    required: true,
    index: true
  },
  appointee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  job: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Job", 
    required: true 
  },
  
  // Official CS Form 33-A Details
  nature: { 
    type: String, 
    enum: ["original", "promotion", "transfer", "reinstatement", "reemployment", "reappointment", "reclassification"],
    required: true 
  },
  status: { 
    type: String, 
    enum: ["permanent", "temporary", "substitute", "coterminous", "contractual", "provisional"],
    required: true 
  },
  salary: { type: Number, required: true },
  effectiveDate: { type: Date, required: true },
  
  signingAuthority: {
    name: { type: String, default: "SCHOOLS DIVISION SUPERINTENDENT" },
    position: { type: String, default: "SDS" }
  },
  
  formMetadata: {
    station: String,
    salaryGrade: Number,
    itemNumber: String,
    pageNumber: String,
    vouchers: String
  },
  
  issuedAt: { type: Date, default: Date.now },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export default mongoose.model("Appointment", appointmentSchema);
