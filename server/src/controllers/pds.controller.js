import Application from "../models/Application.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { generatePDS } from "../services/pds.service.js";
import { logAction } from "../services/audit.service.js";

// ── Export PDS (CS Form 212) ──────────────────────────────────────────────
export const exportPDS = catchAsync(async (req, res, next) => {
  const { applicationId } = req.params;

  // 1. Fetch Application with deep populated user data
  const application = await Application.findById(applicationId)
    .populate("submittedBy", "username email name")
    .populate("submittedTo", "positionTitle");

  if (!application) return next(new AppError("Application not found", 404));

  // 2. Generate PDF
  const pdfDoc = generatePDS(application);

  // 3. Log Audit
  logAction({
    req,
    action: "PDS_EXPORT",
    entityModel: "Application",
    entityId: applicationId,
    description: `Exported PDS for ${application.submittedBy.username}`,
    severity: "medium"
  });

  // 4. Stream Response
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=PDS-${application.applicantData?.personalInfo?.lastName || "CANDIDATE"}.pdf`
  );

  pdfDoc.pipe(res);
  pdfDoc.end();
});
