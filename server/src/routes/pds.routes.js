import express from "express";
import * as pdsController from "../controllers/pds.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);
// PDS contains sensitive info - Restricted to HR/Admin/PBAC
router.use(restrictTo("admin", "hr", "pbac")); 

router.get("/:applicationId/export", pdsController.exportPDS);

export default router;
