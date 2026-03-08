import Document from "../models/Document.js";
import Application from "../models/Application.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { logAction } from "../services/audit.service.js";
import { notifyStatusUpdate } from "../services/email.service.js";

// ── 1. Get Documents for Verification ─────────────────────────────────────
export const getApplicationDocuments = catchAsync(async (req, res, next) => {
  const { applicationId } = req.params;

  const documents = await Document.find({ application: applicationId })
    .populate("owner", "username name email")
    .sort("type");

  res.status(200).json({
    status: "success",
    data: documents
  });
});

// ── 2. Verify or Reject Document ──────────────────────────────────────────
export const verifyDocument = catchAsync(async (req, res, next) => {
  const { documentId } = req.params;
  const { status, remarks } = req.body;

  if (!["verified", "rejected"].includes(status)) {
    return next(new AppError("Invalid verification status", 400));
  }

  const document = await Document.findById(documentId).populate("application");
  if (!document) return next(new AppError("Document not found", 404));

  const oldData = document.toObject();

  document.status = status;
  document.verificationDetails = {
    verifiedBy: req.user._id,
    verifiedAt: new Date(),
    remarks: remarks || ""
  };

  await document.save();

  // 🛡️ Audit Log
  logAction({
    req,
    action: "DOCUMENT_VERIFICATION",
    entityModel: "Document",
    entityId: documentId,
    before: oldData,
    after: document.toObject(),
    severity: status === "rejected" ? "medium" : "low",
    description: `${status.toUpperCase()} document (${document.type}) for ${document.application?.applicationCode || 'Application'}`
  });

  // Check if all documents for this application are now verified
  const allDocs = await Document.find({ application: document.application._id });
  const pendingCount = allDocs.filter(d => d.status === "pending").length;
  const rejectedCount = allDocs.filter(d => d.status === "rejected").length;

  if (pendingCount === 0) {
    const application = await Application.findById(document.application._id).populate("submittedBy", "username email name");
    
    if (rejectedCount > 0) {
      // Potentially flag application as incomplete
      application.isQualified = false;
      application.disqualificationReason = "One or more documents failed verification.";
    } else {
      // Auto-advance if all are verified
      if (application.status === "verifying") {
        application.status = "comparative_assessment";
      }
    }
    await application.save();
  }

  res.status(200).json({
    status: "success",
    data: document
  });
});

// ── 3. Mock Upload (For Testing/Seeding) ──────────────────────────────────
export const mockUpload = catchAsync(async (req, res, next) => {
  const { applicationId, type, fileUrl, fileName } = req.body;

  const application = await Application.findById(applicationId);
  if (!application) return next(new AppError("Application not found", 404));

  const doc = await Document.create({
    application: applicationId,
    owner: application.submittedBy,
    type,
    fileUrl,
    fileName,
    status: "pending"
  });

  res.status(201).json({ status: "success", data: doc });
});
