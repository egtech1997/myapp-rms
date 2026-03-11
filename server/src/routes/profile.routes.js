import express from "express";
import { getMyProfile, upsertMyProfile, uploadProfileDocument } from "../controllers/profile.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { uploadDocument } from "../middlewares/upload.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { profileValidator } from "../validators/profile.validator.js";

const router = express.Router();

router.use(protect);

router.get("/me", getMyProfile);
router.put("/me", validate(profileValidator), upsertMyProfile);
router.post("/upload-doc", uploadDocument.single("file"), uploadProfileDocument);

export default router;
