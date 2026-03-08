import express from "express";
import * as analyticsController from "../controllers/analytics.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);
router.use(restrictTo("admin", "hr")); // Restricted to HR and Admin roles

router.get("/overview", analyticsController.getOverview);
router.get("/trends", analyticsController.getTrends);
router.get("/demographics", analyticsController.getDemographics);
router.get("/efficiency", analyticsController.getEfficiency);

export default router;
