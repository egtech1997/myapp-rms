import express from "express";
import * as searchController from "../controllers/search.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);
router.use(restrictTo("admin", "hr", "pbac"));

router.get("/", searchController.advancedSearch);
router.get("/suggestions", searchController.getSuggestions);

export default router;
