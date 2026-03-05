import express from "express";
import * as roleController from "../controllers/role.controller.js";
import { protect, requirePermission } from "../middlewares/auth.middleware.js";
import { validate, roleValidator } from "../validators/role.validator.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(requirePermission("view:roles"), roleController.getAllRoles)
  .post(
    requirePermission("manage:roles"),
    validate(roleValidator.createOrUpdate),
    roleController.createRole,
  );

router
  .route("/:id")
  .patch(
    requirePermission("manage:roles"),
    validate(roleValidator.createOrUpdate),
    roleController.updateRole,
  )
  .delete(requirePermission("manage:roles"), roleController.deleteRole);

export default router;
