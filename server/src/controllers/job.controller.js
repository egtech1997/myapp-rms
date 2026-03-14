import Job from "../models/Job.js";
import Application from "../models/Application.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

export const createJob = catchAsync(async (req, res, next) => {
  // QS fields are nested in the model but flat in the validator/req.body
  const jobData = {
    ...req.body,
    qualifications: {
      education: req.body.education,
      experience: req.body.experience,
      minExperienceMonths: req.body.minExperienceMonths,
      trainings: req.body.trainings,
      minTrainingHours: req.body.minTrainingHours,
      eligibility: req.body.eligibility,
      competencyRequirements: req.body.competencyRequirements,
    },
    publishedBy: req.user._id,
  };

  // Remove flat QS fields from top-level
  const qsFields = ["education", "experience", "minExperienceMonths", "trainings", "minTrainingHours", "eligibility", "competencyRequirements"];
  qsFields.forEach(f => delete jobData[f]);

  const newJob = await Job.create(jobData);
  res.status(201).json({ status: "success", data: newJob });
});

export const getAllJobs = catchAsync(async (req, res, next) => {
  const queryObj = { ...req.query };
  const excludeFields = ["page", "sort", "limit", "fields", "search"];
  excludeFields.forEach((el) => delete queryObj[el]);

  let query = Job.find(queryObj);

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

export const updateJob = catchAsync(async (req, res, next) => {
  const updateData = { ...req.body };

  // Re-nest qualifications if any QS fields are present
  const qsFields = ["education", "experience", "minExperienceMonths", "trainings", "minTrainingHours", "eligibility", "competencyRequirements"];
  const hasQs = qsFields.some((f) => updateData[f] !== undefined);
  
  if (hasQs) {
    // We need to handle nested updates carefully to avoid overwriting the entire qualifications object
    // if only one field is sent. Mongoose dot notation is best for this.
    qsFields.forEach((f) => {
      if (updateData[f] !== undefined) {
        updateData[`qualifications.${f}`] = updateData[f];
        delete updateData[f];
      }
    });
  }

  const job = await Job.findByIdAndUpdate(req.params.id, { $set: updateData }, {
    returnDocument: 'after',
  });

  if (!job) return next(new AppError("Job not found", 404));
  res.status(200).json({ status: "success", data: job });
});

export const bulkUpdateStatus = catchAsync(async (req, res, next) => {
  const { ids, status, deadline } = req.body;

  if (!ids?.length || !status) {
    return next(new AppError("ids and status are required", 400));
  }

  const validStatuses = ["draft", "published", "closed", "archived"];
  if (!validStatuses.includes(status)) {
    return next(new AppError("Invalid status", 400));
  }

  const update = { status };
  if (deadline !== undefined) update.deadline = deadline || null;

  await Job.updateMany({ _id: { $in: ids } }, { $set: update });

  res.status(200).json({ status: "success", message: `${ids.length} jobs updated` });
});

export const deleteJob = catchAsync(async (req, res, next) => {
  const job = await Job.findByIdAndDelete(req.params.id);
  if (!job) return next(new AppError("Job not found", 404));

  await Application.deleteMany({ submittedTo: job._id });

  res.status(204).send();
});
