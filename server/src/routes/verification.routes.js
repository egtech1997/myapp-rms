import express from "express";
import * as verificationController from "../controllers/verification.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);
router.use(restrictTo("admin", "hr"));

router.get("/:applicationId", verificationController.getApplicationDocuments);
router.post("/:documentId/verify", verificationController.verifyDocument);
router.post("/mock-upload", verificationController.mockUpload);

export default router;
