import Application from "../models/Application.js";
import Profile from "../models/Profile.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { generatePDS } from "../services/pds.service.js";
import { logAction } from "../services/audit.service.js";

// ── Export My PDS (For Authenticated User) ──────────────────────────────
export const exportMyPDS = catchAsync(async (req, res, next) => {
  const profile = await Profile.findOne({ user: req.user._id }).lean();
  if (!profile) return next(new AppError("Profile not found. Please complete your profile first.", 404));

  // Standardize data for generatePDS
  const mockApp = {
    applicantData: {
      personalInfo: {
        ...profile.name,
        sex: profile.sex,
        birthDate: profile.birthDate,
        ethnicGroup: profile.ethnicGroup,
        religion: profile.religion,
        disability: profile.disability,
        civilStatus: profile.civilStatus,
        phones: profile.contact?.phones || [],
        emails: profile.contact?.emails || [],
        address: profile.address
      },
      family: profile.family,
      education: profile.education,
      eligibility: profile.eligibility,
      experience: profile.experience,
      training: profile.training
    }
  };

  const pdfDoc = generatePDS(mockApp);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=PDS-${profile.name?.lastName || "MY-PROFILE"}.pdf`
  );

  pdfDoc.pipe(res);
  pdfDoc.end();
});

// ── Export PDS (CS Form 212) - For Admin/HR ──────────────────────────────
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
