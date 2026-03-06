import express from "express";
import * as userController from "../controllers/user.controller.js";
import { protect, requirePermission } from "../middlewares/auth.middleware.js";
import { validate } from "../validators/role.validator.js";
import { userValidator } from "../validators/user.validator.js";

const router = express.Router();

// Ensure all routes require a valid login token first
router.use(protect);

// 1. List Users
router.get("/", requirePermission("user_view"), userController.getAllUsers);

// 2. Activate/Deactivate User Status
router.patch(
  "/:id/status",
  requirePermission("user_manage"),
  validate(userValidator.toggleStatus),
  userController.toggleUserStatus,
);

export default router;
