import Job from "../models/Job.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

export const createJob = catchAsync(async (req, res, next) => {
  // QS fields are nested in the model but flat in the validator/req.body
  const jobData = {
    ...req.body,
    qualifications: {
      education: req.body.education,
      experience: req.body.experience,
      trainings: req.body.trainings,
      eligibility: req.body.eligibility,
    },
    publishedBy: req.user._id,
  };

  const newJob = await Job.create(jobData);
  res.status(201).json({ status: "success", data: newJob });
});

export const getAllJobs = catchAsync(async (req, res, next) => {
  // Advanced Filtering (Category, Status, Search)
  const queryObj = { ...req.query };
  const excludeFields = ["page", "sort", "limit", "fields", "search"];
  excludeFields.forEach((el) => delete queryObj[el]);

  let query = Job.find(queryObj);

  // Text Search for Position Title
  if (req.query.search) {
    query = query.find({
      positionTitle: { $regex: req.query.search, $options: "i" },
    });
  }

  const jobs = await query.populate("publishedBy", "username");
  res.status(200).json({ status: "success", results: jobs.length, data: jobs });
});

export const getJob = catchAsync(async (req, res, next) => {
  const job = await Job.findById(req.params.id).populate("applications");
  if (!job) return next(new AppError("Job not found", 404));
  res.status(200).json({ status: "success", data: job });
});
