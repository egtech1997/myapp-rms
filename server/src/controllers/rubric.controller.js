import Rubric from "../models/Rubric.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

const TRACKS = ["teaching", "teaching_related", "non_teaching"];

// GET /api/v1/rubrics — return all three rubrics (create defaults if missing)
export const getAllRubrics = catchAsync(async (req, res) => {
  // Ensure all three tracks exist
  await Promise.all(
    TRACKS.map((track) =>
      Rubric.findOneAndUpdate(
        { track },
        { $setOnInsert: { track } },
        { upsert: true, new: true },
      ),
    ),
  );

  const rubrics = await Rubric.find({ track: { $in: TRACKS } });
  res.status(200).json({ status: "success", data: rubrics });
});

// GET /api/v1/rubrics/:category
export const getRubricByCategory = catchAsync(async (req, res, next) => {
  const track = req.params.category;

  if (!TRACKS.includes(track)) {
    return next(new AppError(`Invalid track. Must be one of: ${TRACKS.join(", ")}`, 400));
  }

  const rubric = await Rubric.findOneAndUpdate(
    { track },
    { $setOnInsert: { track } },
    { upsert: true, new: true },
  );

  res.status(200).json({ status: "success", data: rubric });
});

// PUT /api/v1/rubrics/:category — upsert for a track
export const upsertRubric = catchAsync(async (req, res, next) => {
  const track = req.params.category;
  const { criteria, title, active } = req.body;

  if (!TRACKS.includes(track)) {
    return next(new AppError(`Invalid track. Must be one of: ${TRACKS.join(", ")}`, 400));
  }

  const updatePayload = {};
  if (criteria !== undefined) updatePayload.criteria = criteria;
  if (title    !== undefined) updatePayload.title    = title;
  if (active   !== undefined) updatePayload.active   = active;

  const rubric = await Rubric.findOneAndUpdate(
    { track },
    { $set: updatePayload },
    { upsert: true, new: true, runValidators: false },
  );

  res.status(200).json({ status: "success", data: rubric });
});
