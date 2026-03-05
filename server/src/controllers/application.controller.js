import Application from "../models/Application.js";
import catchAsync from "../utils/catchAsync.js";

// 1. Submit Application
export const applyToJob = catchAsync(async (req, res) => {
  const { jobId, category, applicantData } = req.body;

  // Check if already applied to this specific job
  const existing = await Application.findOne({
    submittedBy: req.user._id,
    submittedTo: jobId,
  });

  if (existing) {
    return res
      .status(400)
      .json({ message: "You have already applied for this position." });
  }

  const newApplication = await Application.create({
    submittedBy: req.user._id,
    submittedTo: jobId,
    category,
    applicantData, // Frontend sends the current Profile snapshot
  });

  res.status(201).json({
    status: "success",
    data: newApplication,
  });
});

// 2. Get My Applications (For the User Dashboard)
export const getMyApplications = catchAsync(async (req, res) => {
  const applications = await Application.find({ submittedBy: req.user._id })
    .populate("submittedTo", "title department") // Show job details
    .sort("-createdAt");

  res.status(200).json({ status: "success", data: applications });
});

// 3. Get All Applications for a Job (For HR/Admin)
export const getJobApplications = catchAsync(async (req, res) => {
  const { jobId } = req.params;
  const applications = await Application.find({ submittedTo: jobId })
    .populate("submittedBy", "username email avatar")
    .sort("-totalScore"); // Rank by score for DepEd MSP

  res.status(200).json({ status: "success", data: applications });
});
