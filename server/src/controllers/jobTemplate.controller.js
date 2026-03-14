import JobTemplate from "../models/JobTemplate.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

export const getTemplates = catchAsync(async (req, res) => {
  const templates = await JobTemplate.find()
    .sort("-updatedAt")
    .populate("createdBy", "username");
  res.status(200).json({ status: "success", data: templates });
});

export const createTemplate = catchAsync(async (req, res) => {
  const { education, experience, minExperienceMonths, trainings, minTrainingHours, eligibility, competencyRequirements, ...rest } = req.body;
  const template = await JobTemplate.create({
    ...rest,
    qualifications: { education, experience, minExperienceMonths, trainings, minTrainingHours, eligibility, competencyRequirements },
    createdBy: req.user._id,
  });
  res.status(201).json({ status: "success", data: template });
});

export const updateTemplate = catchAsync(async (req, res) => {
  const { education, experience, minExperienceMonths, trainings, minTrainingHours, eligibility, competencyRequirements, ...rest } = req.body;
  const update = { ...rest };
  if ([education, experience, minExperienceMonths, trainings, minTrainingHours, eligibility, competencyRequirements].some(v => v !== undefined)) {
    if (education             !== undefined) update["qualifications.education"]             = education;
    if (experience            !== undefined) update["qualifications.experience"]            = experience;
    if (minExperienceMonths   !== undefined) update["qualifications.minExperienceMonths"]   = minExperienceMonths;
    if (trainings             !== undefined) update["qualifications.trainings"]             = trainings;
    if (minTrainingHours      !== undefined) update["qualifications.minTrainingHours"]      = minTrainingHours;
    if (eligibility           !== undefined) update["qualifications.eligibility"]           = eligibility;
    if (competencyRequirements !== undefined) update["qualifications.competencyRequirements"] = competencyRequirements;
  }
  const template = await JobTemplate.findByIdAndUpdate(req.params.id, update, { returnDocument: 'after', runValidators: true });
  if (!template) return next(new AppError("Template not found", 404));
  res.status(200).json({ status: "success", data: template });
});

export const deleteTemplate = catchAsync(async (req, res) => {
  const template = await JobTemplate.findByIdAndDelete(req.params.id);
  if (!template) return next(new AppError("Template not found", 404));
  res.status(204).send();
});
