import express from "express";
import * as auditController from "../controllers/audit.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);
router.use(restrictTo("admin", "hr", "pbac")); // Restricted to HR and Admins

router.get("/", auditController.getAuditLogs);
router.get("/:model/:id", auditController.getEntityLogs);

export default router;
