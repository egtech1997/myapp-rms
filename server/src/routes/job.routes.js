import express from "express";
import * as jobController from "../controllers/job.controller.js";

import { protect, requirePermission } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { jobSchema, jobUpdateSchema } from "../validators/job.validator.js";

const router = express.Router();

// Public: anyone can browse published jobs
router.get("/", jobController.getAllJobs);
router.get("/:id", jobController.getJob);

// Protected: admins only
router.use(protect);

router.post("/", requirePermission("vac_create"), validate(jobSchema), jobController.createJob);
router.patch("/bulk-status", requirePermission("vac_edit"), jobController.bulkUpdateStatus);
router.patch("/:id", requirePermission("vac_edit"), validate(jobUpdateSchema), jobController.updateJob);
router.patch("/:id/finalize-ier", requirePermission("vac_edit"), jobController.finalizeIer);
router.delete("/:id", requirePermission("vac_delete"), jobController.deleteJob);

export default router;
