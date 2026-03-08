import express from "express";
import { getAllRubrics, getRubricByCategory, upsertRubric } from "../controllers/rubric.controller.js";
import { protect, requirePermission } from "../middlewares/auth.middleware.js";
import Rubric from "../models/Rubric.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

const router = express.Router();

// Public read — applicants & HR both need to see rubric weights
router.get("/", getAllRubrics);
router.get("/track/:track", catchAsync(async (req, res, next) => {
  const rubric = await Rubric.findOne({ track: req.params.track, active: true });
  if (!rubric) return next(new AppError("Rubric not found for this track", 404));
  res.status(200).json({ status: "success", data: rubric });
}));
router.get("/:category", getRubricByCategory);

// Admin write
router.put("/:category", protect, requirePermission("rubric_manage"), upsertRubric);

export default router;
