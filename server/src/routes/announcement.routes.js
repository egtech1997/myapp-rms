import express from "express";
import * as c from "../controllers/announcement.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public
router.get("/", c.getPublicAnnouncements);

// Admin-only
router.use(protect);
router.get("/admin", restrictTo("admin", "hr", "Super Admin"), c.getAllAnnouncements);
router.post("/", restrictTo("admin", "hr", "Super Admin"), c.createAnnouncement);
router.post("/ier", restrictTo("admin", "hr", "Super Admin"), c.createIerAnnouncement);
router.patch("/:id", restrictTo("admin", "hr", "Super Admin"), c.updateAnnouncement);
router.delete("/:id", restrictTo("admin", "hr", "Super Admin"), c.deleteAnnouncement);

export default router;
