import express from "express";
import * as roleController from "../controllers/role.controller.js";
import { protect, requirePermission } from "../middlewares/auth.middleware.js";
import { validate, roleValidator } from "../validators/role.validator.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(requirePermission("role_view"), roleController.getAllRoles)
  .post(
    requirePermission("role_manage"),
    validate(roleValidator.createOrUpdate),
    roleController.createRole,
  );

router
  .route("/:id")
  .patch(
    requirePermission("role_manage"),
    validate(roleValidator.createOrUpdate),
    roleController.updateRole,
  )
  .delete(requirePermission("role_manage"), roleController.deleteRole);

export default router;
