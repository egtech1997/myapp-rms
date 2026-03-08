import express from "express";
import * as bulkController from "../controllers/bulk.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);
router.use(restrictTo("admin", "hr"));

router.post("/send", bulkController.sendBulk);
router.get("/history", bulkController.getBulkHistory);
router.get("/status/:id", bulkController.getBulkStatus);

export default router;
