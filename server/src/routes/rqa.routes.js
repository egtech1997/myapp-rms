import express from "express";
import * as rqaController from "../controllers/rqa.controller.js";
import { protect, requirePermission } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/:jobId", requirePermission("rqa_view"), rqaController.getRQA);
router.get("/:jobId/export", requirePermission("rqa_export"), rqaController.exportRQA);
router.get("/:jobId/export-ier", requirePermission("rqa_export"), rqaController.exportIER);
router.post("/:jobId/generate", requirePermission("rqa_generate"), rqaController.generateRanking);

export default router;
