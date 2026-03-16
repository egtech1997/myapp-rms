import Application from "../models/Application.js";
import Profile from "../models/Profile.js";
import Job from "../models/Job.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { notifyStatusUpdate } from "../services/email.service.js";
import { logAction } from "../services/audit.service.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import vm from "vm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Shared helper: parse a profile sub-array that may have been stored as a ──
// stringified element in MongoDB (e.g. from Vue reactive proxy edge cases).
const parseProfileArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.flatMap((item) => {
    if (item && typeof item === 'object') return [item];
    if (typeof item !== 'string') return [];
    const trimmed = item.trim();
    const target = trimmed.startsWith('[') ? trimmed : trimmed.startsWith('{') ? `[${trimmed}]` : null;
    if (!target) return [];
    // Try JSON first
    try {
      const parsed = JSON.parse(target);
      return Array.isArray(parsed) ? parsed.filter(i => i && typeof i === 'object') : [];
    } catch {}
    // JS-notation fallback (single quotes, new ObjectId, raw dates)
    try {
      const ctx = vm.createContext({ ObjectId: (v) => v, Date });
      const result = vm.runInNewContext(target, ctx);
      if (Array.isArray(result)) return result.filter(i => i && typeof i === 'object');
    } catch {}
    // Last resort: regex extract {...} blocks
    const extract = (block, f) => {
      const m = block.match(new RegExp(`${f}:\\s*['"]([^'"]+)['"]`)) ||
                block.match(new RegExp(`${f}:\\s*([^,\\s}]+)`));
      return m ? m[1] : undefined;
    };
    const blocks = target.match(/\{[^{}]+\}/g) || [];
    return blocks.map(block => Object.fromEntries(
      ['type','name','rating','dateOfExam','placeOfExam','licenseNumber',
       'licenseValidity','document','licenseDocument','school','degree',
       'level','position','company','serviceType','title','hours','periodFrom','periodTo',
       'provider','typeOfLD','salaryGrade','statusOfAppointment']
        .map(f => [f, extract(block, f)])
        .filter(([, v]) => v !== undefined)
    )).filter(o => Object.keys(o).length > 0);
  });
};

// ── 1. Submit Application (User) ────────────────────────────────────────────
export const applyToJob = catchAsync(async (req, res, next) => {
  const { jobId, category, submissionDocs } = req.body;

  const job = await Job.findById(jobId);
  if (!job) return next(new AppError("Job not found.", 404));
  if (job.status !== "published") {
    return next(new AppError("This vacancy is not accepting applications.", 400));
  }

  const existing = await Application.findOne({
    submittedBy: req.user._id,
    submittedTo: jobId,
  });
  if (existing) {
    return next(new AppError("You have already applied for this position.", 400));
  }

  // Client sends selected sub-arrays via applicantData; personalInfo is always
  // force-snapshotted server-side for integrity.
  const applicantData = req.body.applicantData || {};

  const profile = await Profile.findOne({ user: req.user._id }).lean();
  if (!profile) return next(new AppError("Please complete your PDS profile before applying.", 400));

  // Force-snapshot personal info from server-side profile (cannot be spoofed)
  applicantData.personalInfo = {
    firstName:        profile.name?.firstName,
    middleName:       profile.name?.middleName,
    lastName:         profile.name?.lastName,
    suffix:           profile.name?.suffix,
    sex:              profile.sex,
    birthDate:        profile.birthDate,
    isIndigenous:     profile.isIndigenous,
    religion:         profile.religion,
    disability:       profile.disability,
    civilStatus:      profile.civilStatus,
    gsisNo:           profile.gsisNo,
    pagibigNo:        profile.pagibigNo,
    philhealthNo:     profile.philhealthNo,
    tinNo:            profile.tinNo,
    philSysNo:        profile.philSysNo,
    agencyEmployeeNo: profile.agencyEmployeeNo,
    phones:           profile.contact?.phones || [],
    emails:           profile.contact?.emails || [],
    currentAddress:   profile.currentAddress,
    comelecAddress:   profile.comelecAddress,
  };

  // Supplemental fields always snapshotted from server profile
  applicantData.voluntaryWork           = profile.voluntaryWork || [];
  applicantData.competencies            = profile.competencies  || [];
  applicantData.specialSkills           = profile.specialSkills || [];
  applicantData.nonAcademicDistinctions = profile.nonAcademicDistinctions || [];
  applicantData.memberships             = profile.memberships   || [];

  // If the client did not send selected sub-arrays, fall back to full profile snapshot
  // parseProfileArray sanitizes any corrupt string items that may be stored in the profile
  if (!applicantData.education)   applicantData.education   = parseProfileArray(profile.education   || []);
  if (!applicantData.eligibility) applicantData.eligibility = parseProfileArray(profile.eligibility || []);
  if (!applicantData.experience)  applicantData.experience  = parseProfileArray(profile.experience  || []);
  if (!applicantData.training)    applicantData.training    = parseProfileArray(profile.training    || []);
  // performanceRating is per-application (not stored in profile) — keep what client sent or default to {}
  if (!applicantData.performanceRating) applicantData.performanceRating = {};

  const newApplication = await Application.create({
    submittedBy: req.user._id,
    submittedTo: jobId,
    category,
    applicantData,
    submissionDocs: submissionDocs || {},
  });

  // No longer maintaining Job.applications array — use Application.find({ submittedTo: jobId }) instead

  res.status(201).json({ status: "success", data: newApplication });
});

// ── 2. Get My Applications (User) ──────────────────────────────────────────
export const getMyApplications = catchAsync(async (req, res, next) => {
  const applications = await Application.find({ submittedBy: req.user._id })
    .populate("submittedTo", "positionTitle positionCode placeOfAssignment hiringTrack status deadline salary salaryGrade qualifications itemNumbers finalIerReleasedAt finalIerReleasedBy")
    .populate("verifiedBy", "username email avatarUrl firstName middleName lastName")
    .sort("-createdAt")
    .lean();

  // Alias submittedTo → job for frontend compatibility
  const data = applications.map(app => ({
    ...app,
    job: app.submittedTo,
  }));

  res.status(200).json({ status: "success", data });
});

// ── 3. Get All Applications for a Job (Admin) ──────────────────────────────
export const getJobApplications = catchAsync(async (req, res, next) => {
  const { jobId } = req.params;
  const applications = await Application.find({ submittedTo: jobId })
    .populate("submittedBy", "username email avatarUrl")
    .sort("-totalScore")
    .lean();

  res.status(200).json({ status: "success", data: applications });
});

// ── 4. Get Single Application (Admin) ─────────────────────────────────────
export const getApplicationById = catchAsync(async (req, res, next) => {
  const application = await Application.findById(req.params.id)
    .populate("submittedBy", "username email avatarUrl")
    .populate("submittedTo");

  if (!application) return next(new AppError("Application not found.", 404));

  res.status(200).json({ status: "success", data: application });
});

// ── 5. Update Applicant Data (User) ────────────────────────────────────────
export const updateApplicantData = catchAsync(async (req, res, next) => {
  const application = await Application.findById(req.params.id);
  if (!application) return next(new AppError("Application not found.", 404));

  if (application.submittedBy.toString() !== req.user._id.toString()) {
    return next(new AppError("Not authorized.", 403));
  }
  if (application.isVerified) {
    return next(new AppError("This application has been verified and can no longer be edited.", 400));
  }

  const { applicantData } = req.body;
  if (!applicantData) return next(new AppError("No applicantData provided.", 400));

  const clean = { ...applicantData };
  ['education', 'eligibility', 'experience', 'training'].forEach(key => {
    if (Array.isArray(clean[key])) clean[key] = parseProfileArray(clean[key]);
  });
  application.applicantData = clean;
  application.markModified('applicantData');
  await application.save({ validateBeforeSave: false });

  res.status(200).json({ status: "success", data: application });
});

// ── 6. Update HR Rating (Admin — draft save, no finalize) ──────────────────
export const updateHrRating = catchAsync(async (req, res, next) => {
  const { hrRating } = req.body;
  const application = await Application.findById(req.params.id);

  if (!application) return next(new AppError("Application not found.", 404));

  application.hrRating = { ...application.hrRating, ...hrRating };
  await application.save();

  res.status(200).json({ status: "success", data: application });
});

// ── 7. Update Application Status (Admin) ───────────────────────────────────
export const updateApplicationStatus = catchAsync(async (req, res, next) => {
  const { 
    status, 
    isQualified, 
    disqualificationReason, 
    isVerified, 
    verificationChecklist,
    applicantData
  } = req.body;

  const application = await Application.findById(req.params.id)
    .populate("submittedBy")
    .populate("submittedTo");

  if (!application) return next(new AppError("Application not found.", 404));

  const oldData = application.toObject();
  const oldStatus = application.status;

  if (status !== undefined) application.status = status;
  if (isQualified !== undefined) application.isQualified = isQualified;
  if (disqualificationReason !== undefined) application.disqualificationReason = disqualificationReason;
  if (verificationChecklist !== undefined) application.verificationChecklist = verificationChecklist;
  
  // Handle relevance audit data — sanitize array sections to prevent corrupt
  // stringified elements (Vue proxy edge-case) from breaking Mongoose casting.
  if (applicantData !== undefined) {
    const clean = { ...applicantData };
    ['education', 'eligibility', 'experience', 'training'].forEach(key => {
      if (Array.isArray(clean[key])) clean[key] = parseProfileArray(clean[key]);
    });
    application.applicantData = clean;
    application.markModified('applicantData');
  }

  if (isVerified === true) {
    application.isVerified = true;
    application.verifiedAt = new Date();
    application.verifiedBy = req.user._id;
    if (["applied", "verifying"].includes(application.status)) {
      application.status = "comparative_assessment";
    }
  }

  await application.save({ validateBeforeSave: false });

  logAction({
    req,
    action: "APPLICATION_UPDATE",
    entityModel: "Application",
    entityId: application._id,
    before: oldData,
    after: application.toObject(),
    description: `Updated status for ${application.submittedBy.username}`
  });

  if (application.status !== oldStatus) {
    let auditSummary = application.disqualificationReason || "";

    // If disqualified, append specific irrelevant item remarks for transparency
    if (application.status === 'disqualified' && application.applicantData) {
      const irrelevantItems = [];
      ['education', 'experience', 'training', 'eligibility'].forEach(key => {
        const items = application.applicantData[key] || [];
        items.forEach(item => {
          if (item.isRelevant === false && item.auditRemarks) {
            irrelevantItems.push(`<strong>${key.toUpperCase()}</strong>: ${item.auditRemarks}`);
          }
        });
      });

      if (irrelevantItems.length > 0) {
        auditSummary += (auditSummary ? "<br/><br/>" : "") + 
          "<strong>Specific Audit Findings:</strong><br/><ul>" + 
          irrelevantItems.map(i => `<li>${i}</li>`).join("") + 
          "</ul>";
      }
    }

    notifyStatusUpdate({
      user: application.submittedBy,
      application: application,
      oldStatus: oldStatus,
      newStatus: application.status,
      jobTitle: application.submittedTo.positionTitle,
      reason: auditSummary
    });
  }

  res.status(200).json({ status: "success", data: application });
});

// ── 8. Evaluate/Rate Application (Admin) ───────────────────────────────────
export const evaluateApplication = catchAsync(async (req, res, next) => {
  const { hrRating, finalize } = req.body;
  const application = await Application.findById(req.params.id)
    .populate("submittedBy")
    .populate("submittedTo");

  if (!application) return next(new AppError("Application not found.", 404));

  const oldStatus = application.status;

  if (hrRating) {
    application.hrRating = { ...application.hrRating, ...hrRating };
  }

  if (finalize) {
    application.isEvaluated = true;
    application.status = "ranked";
  }

  await application.save();

  if (finalize && application.status !== oldStatus) {
    notifyStatusUpdate({
      user: application.submittedBy,
      application: application,
      oldStatus: oldStatus,
      newStatus: application.status,
      jobTitle: application.submittedTo?.positionTitle || "Position"
    });
  }

  res.status(200).json({ status: "success", data: application });
});

export const uploadApplicationAttachment = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { type } = req.body;

  if (!req.file) {
    return next(new AppError('No file uploaded.', 400));
  }

  const application = await Application.findById(id);
  if (!application) {
    return next(new AppError('Application not found.', 404));
  }

  if (application.submittedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this application.', 403));
  }

  if (application.isVerified) {
    return next(new AppError('Application is already verified and locked.', 400));
  }

  // Mulder already saved the file with a unique name in docUploadDir
  const fileUrl = '/uploads/documents/' + req.file.filename;
  const fileName = req.file.originalname;
  const publicDir = path.join(__dirname, '..', '..', 'public');

  const existingIdx = application.attachments.findIndex(a => a.type === type);
  if (existingIdx !== -1) {
    // ── Delete Old File if URL Changed ───────────────────────────────────
    const oldUrl = application.attachments[existingIdx].fileUrl;
    if (oldUrl && oldUrl !== fileUrl) {
      const oldPath = path.join(publicDir, oldUrl.replace('/api/', '/'));
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          console.error("Old attachment delete failed:", e);
        }
      }
    }
    application.attachments[existingIdx] = { type, fileUrl, fileName, uploadedAt: Date.now() };
  } else {
    application.attachments.push({ type, fileUrl, fileName });
  }

  await application.save();

  res.status(200).json({
    status: 'success',
    data: application
  });
});

export const syncApplicationWithProfile = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const application = await Application.findById(id);
  if (!application) return next(new AppError('Application not found.', 404));

  const profile = await Profile.findOne({ user: application.submittedBy }).lean();
  if (!profile) return next(new AppError('Profile not found for this user.', 404));

  // Sanitize profile arrays — if a field was stored as a stringified array in the DB
  // (JS-notation with single quotes), parse it back to proper objects.
  const parseProfileArray = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.flatMap(item => {
      if (item && typeof item === 'object') return [item];
      if (typeof item !== 'string') return [];
      const trimmed = item.trim();
      const target = trimmed.startsWith('[') ? trimmed : `[${trimmed}]`;
      // Try vm.runInNewContext which handles JS-notation (single quotes, new ObjectId, etc.)
      try {
        const ctx = vm.createContext({ ObjectId: (v) => v, Date: Date });
        const result = vm.runInNewContext(target, ctx);
        if (Array.isArray(result)) return result.filter(r => r && typeof r === 'object');
      } catch {}
      // Fallback: extract individual {...} blocks via regex
      const extract = (block, f) => {
        const m = block.match(new RegExp(`${f}:\\s*['"]([^'"]+)['"]`)) ||
                  block.match(new RegExp(`${f}:\\s*([^,\\s}]+)`));
        return m ? m[1] : null;
      };
      const blocks = trimmed.match(/\{[^{}]+\}/g) || [];
      return blocks.map(block => Object.fromEntries(
        ['type','name','rating','dateOfExam','placeOfExam','licenseNumber',
         'licenseValidity','document','licenseDocument','school','degree',
         'level','position','company','serviceType','title','hours',
         'periodFrom','periodTo','provider','typeOfLD','salaryGrade','statusOfAppointment']
          .map(f => [f, extract(block, f)])
          .filter(([, v]) => v !== null)
      )).filter(o => Object.keys(o).length > 0);
    });
  };

  // Nullify empty strings for Date fields so Mongoose doesn't throw a CastError
  const nullifyDates = (arr, dateFields) =>
    arr.map(item => {
      const out = { ...item };
      dateFields.forEach(f => { if (out[f] === '' || out[f] === 'null') out[f] = null; });
      return out;
    });

  const newApplicantData = {
    personalInfo: {
      firstName: profile.name?.firstName,
      middleName: profile.name?.middleName,
      lastName: profile.name?.lastName,
      suffix: profile.name?.suffix,
      sex: profile.sex,
      birthDate: profile.birthDate,
      isIndigenous: profile.isIndigenous,
      religion: profile.religion,
      disability: profile.disability,
      civilStatus: profile.civilStatus,
      gsisNo: profile.gsisNo,
      pagibigNo: profile.pagibigNo,
      philhealthNo: profile.philhealthNo,
      tinNo: profile.tinNo,
      philSysNo: profile.philSysNo,
      agencyEmployeeNo: profile.agencyEmployeeNo,
      phones: profile.contact?.phones || [],
      emails: profile.contact?.emails || [],
      currentAddress: profile.currentAddress,
      comelecAddress: profile.comelecAddress,
    },
    education:   parseProfileArray(profile.education),
    eligibility: nullifyDates(parseProfileArray(profile.eligibility), ['dateOfExam', 'licenseValidity']),
    experience:  nullifyDates(parseProfileArray(profile.experience),  ['periodFrom', 'periodTo']),
    training:    nullifyDates(parseProfileArray(profile.training),    ['dateIssued']),
    voluntaryWork: profile.voluntaryWork || [],
    // performanceRating is per-application (not stored in profile) — always preserve submitted value
    performanceRating: application.applicantData?.performanceRating || {},
    competencies: profile.competencies || [],
    specialSkills: profile.specialSkills || [],
    nonAcademicDistinctions: profile.nonAcademicDistinctions || [],
    memberships: profile.memberships || [],
  };

  // Write directly via the raw MongoDB driver — bypasses ALL Mongoose schema casting,
  // strict mode, and validators so every profile field is stored as-is.
  await Application.collection.updateOne(
    { _id: application._id },
    { $set: { applicantData: newApplicantData } }
  );

  const updated = await Application.findById(application._id);
  res.status(200).json({ status: 'success', data: updated });
});

// ── Upload Application Submission Document ───────────────────────────────────
// POST /v1/applications/upload-doc
// Multer (applicationDocStorage) saves to:
//   public/uploads/applications/{jobId}/{userId}/{timestamp}.ext
// Returns { fileUrl, fileName } for the client to collect before final submit.
const publicDir = path.join(__dirname, "..", "..", "public");

export const uploadSubmissionDoc = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError("No file uploaded.", 400));

  const relativePath = req.file.destination
    .replace(publicDir, "")
    .replace(/\\/g, "/");

  const fileUrl  = `${relativePath}/${req.file.filename}`;
  const fileName = req.file.originalname;

  res.status(200).json({ status: "success", fileUrl, fileName });
});
