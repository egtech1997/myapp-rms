import Application from "../models/Application.js";
import Profile from "../models/Profile.js";
import Job from "../models/Job.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { notifyStatusUpdate } from "../services/email.service.js";
import { logAction } from "../services/audit.service.js";

// ── 1. Submit Application (User) ────────────────────────────────────────────
export const applyToJob = catchAsync(async (req, res, next) => {
  const { jobId, category } = req.body;

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

  let applicantData = req.body.applicantData || null;
  if (!applicantData) {
    const profile = await Profile.findOne({ user: req.user._id }).lean();
    if (profile) {
      applicantData = {
        personalInfo: {
          firstName: profile.name?.firstName,
          middleName: profile.name?.middleName,
          lastName: profile.name?.lastName,
          suffix: profile.name?.suffix,
          sex: profile.sex,
          birthDate: profile.birthDate,
          ethnicGroup: profile.ethnicGroup,
          religion: profile.religion,
          disability: profile.disability,
          civilStatus: profile.civilStatus,
          phones: profile.contact?.phones || [],
          emails: profile.contact?.emails || [],
          address: profile.address,
        },
        education: profile.education || [],
        eligibility: profile.eligibility || [],
        experience: profile.experience || [],
        training: profile.training || [],
        voluntaryWork: profile.voluntaryWork || [],
        competencies: profile.competencies || [],
        specialSkills: profile.specialSkills || [],
        nonAcademicDistinctions: profile.nonAcademicDistinctions || [],
        memberships: profile.memberships || [],
        performanceRating: profile.performanceRating || {},
      };
    } else {
      applicantData = {};
    }
  }

  const newApplication = await Application.create({
    submittedBy: req.user._id,
    submittedTo: jobId,
    category,
    applicantData,
  });

  await Job.findByIdAndUpdate(jobId, {
    $addToSet: { applications: newApplication._id },
  });

  res.status(201).json({ status: "success", data: newApplication });
});

// ── 2. Get My Applications (User) ──────────────────────────────────────────
export const getMyApplications = catchAsync(async (req, res, next) => {
  const applications = await Application.find({ submittedBy: req.user._id })
    .populate("submittedTo", "positionTitle positionCode placeOfAssignment hiringTrack status deadline salary salaryGrade")
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
    .sort("-totalScore");

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

  application.applicantData = applicantData;
  await application.save();

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
  const { status, isQualified, disqualificationReason, isVerified, verificationChecklist } = req.body;

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

  if (isVerified === true && !application.isVerified) {
    application.isVerified = true;
    application.verifiedAt = new Date();
    application.verifiedBy = req.user._id;
    if (["applied", "verifying"].includes(application.status)) {
      application.status = "comparative_assessment";
    }
  }

  await application.save();

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
    notifyStatusUpdate({
      user: application.submittedBy,
      application: application,
      oldStatus: oldStatus,
      newStatus: application.status,
      jobTitle: application.submittedTo.positionTitle
    });
  }

  res.status(200).json({ status: "success", data: application });
});

// ── 8. Evaluate/Rate Application (Admin) ───────────────────────────────────
export const evaluateApplication = catchAsync(async (req, res, next) => {
  const { hrRating, finalize } = req.body;
  const application = await Application.findById(req.params.id);

  if (!application) return next(new AppError("Application not found.", 404));

  if (hrRating) {
    application.hrRating = { ...application.hrRating, ...hrRating };
  }

  if (finalize) {
    application.isEvaluated = true;
    application.status = "ranked";
  }

  await application.save();
  res.status(200).json({ status: "success", data: application });
});
