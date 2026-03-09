import express from "express";
import * as pdsController from "../controllers/pds.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

// Users can export their own profile
router.get("/me/export", pdsController.exportMyPDS);

// PDS for specific applications - Restricted to HR/Admin/PBAC
router.get("/:applicationId/export", restrictTo("admin", "hr", "pbac"), pdsController.exportPDS);

export default router;
