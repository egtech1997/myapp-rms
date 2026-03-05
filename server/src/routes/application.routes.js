import express from "express";
import * as appController from "../controllers/application.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect); // All application routes require login

router.post("/apply", appController.applyToJob);
router.get("/my-applications", appController.getMyApplications);
router.get("/job/:jobId", appController.getJobApplications);

export default router;
