import Profile from "../models/Profile.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

export const getMyProfile = catchAsync(async (req, res) => {
  const profile = await Profile.findOne({ user: req.user._id });
  res.status(200).json({ status: "success", data: profile || null });
});

export const upsertMyProfile = catchAsync(async (req, res) => {
  const { name } = req.body;

  if (!name?.firstName?.trim() || !name?.lastName?.trim()) {
    throw new AppError("First name and last name are required.", 400);
  }

  const profile = await Profile.findOneAndUpdate(
    { user: req.user._id },
    { $set: { ...req.body, user: req.user._id } },
    { new: true, upsert: true, runValidators: false },
  );

  res.status(200).json({ status: "success", data: profile });
});

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadProfileDocument = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("Please upload a file", 400));
  }

  // Mulder already saved the file with a unique name in docUploadDir
  // We just return the URL pointing to that file
  const fileUrl = `/uploads/documents/${req.file.filename}`;

  // ── Delete Old File if Provided ───────────────────────────────────────
  const { oldUrl } = req.body;
  const publicDir = path.join(__dirname, "..", "..", "public");
  
  if (oldUrl && oldUrl !== fileUrl) {
    const oldPath = path.join(publicDir, oldUrl.replace('/api/', '/'));
    if (fs.existsSync(oldPath) && !oldPath.includes('default')) {
      try {
        fs.unlinkSync(oldPath);
      } catch (e) {
        console.error("Old profile document delete failed:", e);
      }
    }
  }

  res.status(200).json({
    status: "success",
    fileUrl,
  });
});
