import express from "express";
import * as appointController from "../controllers/appointment.controller.js";
import { protect, requirePermission } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);
router.use(requirePermission("application_manage")); // SDS/HRMO only

router.get("/pool/:jobId", appointController.getSelectionPool);
router.get("/:id/export", appointController.exportAppointmentForm);
router.patch("/appoint", appointController.appointCandidate);

export default router;
