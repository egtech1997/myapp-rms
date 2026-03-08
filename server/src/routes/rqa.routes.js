import express from "express";
import * as rqaController from "../controllers/rqa.controller.js";
import { protect, requirePermission } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);
router.use(requirePermission("application_manage")); // Only admins can generate ranking

router.get("/:jobId", rqaController.getRQA);
router.get("/:jobId/export", rqaController.exportRQA);
router.post("/:jobId/generate", rqaController.generateRanking);

export default router;
