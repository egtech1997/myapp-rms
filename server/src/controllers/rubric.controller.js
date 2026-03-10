import Rubric from "../models/Rubric.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

const CATEGORIES = ["teaching", "teaching_related", "non_teaching", "school_admin"];

// GET /api/v1/rubrics — return all rubrics
export const getAllRubrics = catchAsync(async (req, res) => {
  const rubrics = await Rubric.find({ category: { $in: CATEGORIES } });
  res.status(200).json({ status: "success", data: rubrics });
});

// GET /api/v1/rubrics/:category
export const getRubricByCategory = catchAsync(async (req, res, next) => {
  const category = req.params.category;

  if (!CATEGORIES.includes(category)) {
    return next(new AppError(`Invalid category. Must be one of: ${CATEGORIES.join(", ")}`, 400));
  }

  const rubric = await Rubric.findOne({ category });
  if (!rubric) return next(new AppError("Rubric not found", 404));

  res.status(200).json({ status: "success", data: rubric });
});

// PUT /api/v1/rubrics/:category — upsert for a category
export const upsertRubric = catchAsync(async (req, res, next) => {
  const category = req.params.category;
  
  if (!CATEGORIES.includes(category)) {
    return next(new AppError(`Invalid category. Must be one of: ${CATEGORIES.join(", ")}`, 400));
  }

  const rubric = await Rubric.findOneAndUpdate(
    { category },
    { $set: { ...req.body, category } },
    { upsert: true, new: true, runValidators: false },
  );

  res.status(200).json({ status: "success", data: rubric });
});
