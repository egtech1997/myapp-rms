import express from "express";
import * as c from "../controllers/resource.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";
import { uploadResourceFile } from "../middlewares/upload.middleware.js";

const router = express.Router();

// Public — any authenticated user (or public) can browse resources
router.get("/", c.getPublishedResources);

// Admin-only
router.use(protect);
router.get("/admin",           restrictTo("admin", "hr", "Super Admin"), c.getAllResources);
router.post("/",               restrictTo("admin", "hr", "Super Admin"), uploadResourceFile, c.createResource);
router.patch("/:id",           restrictTo("admin", "hr", "Super Admin"), uploadResourceFile, c.updateResource);
router.patch("/:id/toggle",    restrictTo("admin", "hr", "Super Admin"), c.togglePublish);
router.delete("/:id",          restrictTo("admin", "hr", "Super Admin"), c.deleteResource);

export default router;
