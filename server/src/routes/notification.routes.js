import express from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/me", notificationController.getMyNotifications);
router.patch("/:id/read", notificationController.markAsRead);
router.patch("/mark-all-read", notificationController.markAllAsRead);

export default router;
