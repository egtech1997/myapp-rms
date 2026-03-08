import Interview from "../models/Interview.js";
import Application from "../models/Application.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

// ── 1. Create or Update Draft ──────────────────────────────────────────────
export const createOrUpdateInterview = catchAsync(async (req, res, next) => {
  const { application: appId, criteria, overallRemarks } = req.body;

  const application = await Application.findById(appId);
  if (!application) return next(new AppError("Application not found", 404));

  // Upsert logic for current panelist + application
  let interview = await Interview.findOne({ 
    application: appId, 
    panelist: req.user._id 
  });

  if (!interview) {
    interview = new Interview({
      application: appId,
      panelist: req.user._id,
      job: application.submittedTo,
      criteria,
      overallRemarks
    });
  } else {
    if (interview.status === 'submitted') {
      return next(new AppError("This interview has already been submitted and cannot be edited.", 400));
    }
    interview.criteria = criteria;
    interview.overallRemarks = overallRemarks;
  }

  await interview.save();

  res.status(200).json({ status: "success", data: interview });
});

// ── 2. Get Single Interview ───────────────────────────────────────────────
export const getInterviewById = catchAsync(async (req, res, next) => {
  const interview = await Interview.findById(req.params.id)
    .populate("panelist", "username name")
    .populate("application");

  if (!interview) return next(new AppError("Interview not found", 404));

  res.status(200).json({ status: "success", data: interview });
});

// ── 3. Get All Interviews for an Application ─────────────────────────────
export const getInterviewsByApplication = catchAsync(async (req, res) => {
  const interviews = await Interview.find({ application: req.params.appId })
    .populate("panelist", "username name avatarUrl")
    .sort("-createdAt");

  res.status(200).json({ status: "success", data: interviews });
});

// ── 4. Submit Interview (Finalize) ───────────────────────────────────────
export const submitInterview = catchAsync(async (req, res, next) => {
  const interview = await Interview.findById(req.params.id);
  if (!interview) return next(new AppError("Interview not found", 404));

  if (interview.panelist.toString() !== req.user._id.toString()) {
    return next(new AppError("You are not authorized to submit this interview.", 403));
  }

  interview.status = "submitted";
  interview.submittedAt = new Date();
  await interview.save();

  // SIDE EFFECT: Update the Application's BEI score
  // We average all submitted interviews for this application
  const submittedInterviews = await Interview.find({ 
    application: interview.application, 
    status: "submitted" 
  });

  const totalAverage = submittedInterviews.reduce((acc, curr) => acc + curr.totalScore, 0) / submittedInterviews.length;

  await Application.findByIdAndUpdate(interview.application, {
    "hrRating.potentialPoints.bei": totalAverage.toFixed(2)
  });

  res.status(200).json({ status: "success", data: interview });
});

// ── 5. Standard CRUD ──────────────────────────────────────────────────────
export const getAllInterviews = catchAsync(async (req, res) => {
  const interviews = await Interview.find().populate("panelist application");
  res.status(200).json({ status: "success", data: interviews });
});

export const updateInterview = catchAsync(async (req, res, next) => {
  const interview = await Interview.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!interview) return next(new AppError("Interview not found", 404));
  res.status(200).json({ status: "success", data: interview });
});

export const deleteInterview = catchAsync(async (req, res, next) => {
  const interview = await Interview.findByIdAndDelete(req.params.id);
  if (!interview) return next(new AppError("Interview not found", 404));
  res.status(204).json({ status: "success", data: null });
});
