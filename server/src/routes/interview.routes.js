import express from "express";
import * as interviewController from "../controllers/interview.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

// Only PBAC and Admins can access interviews
router.use(restrictTo("admin", "pbac", "hr"));

router.route("/")
  .post(interviewController.createOrUpdateInterview)
  .get(interviewController.getAllInterviews);

router.route("/application/:appId")
  .get(interviewController.getInterviewsByApplication);

router.route("/:id")
  .get(interviewController.getInterviewById)
  .patch(interviewController.updateInterview)
  .delete(interviewController.deleteInterview);

router.patch("/:id/submit", interviewController.submitInterview);

export default router;
