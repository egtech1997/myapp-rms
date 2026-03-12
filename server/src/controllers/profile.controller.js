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

  const { type, field } = req.body; // type: 'education', field: 'diploma' or 'tor'
  if (!type) {
    return next(new AppError("Document type is required", 400));
  }

  const userEmail = req.user.email;
  const profile = await Profile.findOne({ user: req.user._id });
  
  // ── Determine the next number for this type/field ──────────────────
  let count = 1;
  if (profile) {
    const items = profile[type] || [];
    // Only count items that already have this specific document field attached
    const existingDocs = items.filter(item => field ? item[field] : item.document).length;
    count = existingDocs + 1;
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const fileSuffix = field ? `${type}-${field}` : type;
  let newFileName = `${userEmail}-${fileSuffix}${count}${ext}`;
  const publicDir = path.join(__dirname, "..", "..", "public");
  let newFilePath = path.join(publicDir, 'uploads', 'documents', newFileName);

  // If for some reason the file already exists on disk (e.g. from a previous failed save),
  // we increment until we find a free name.
  while (fs.existsSync(newFilePath)) {
    count++;
    newFileName = `${userEmail}-${fileSuffix}${count}${ext}`;
    newFilePath = path.join(publicDir, 'uploads', 'documents', newFileName);
  }

  try {
    fs.renameSync(req.file.path, newFilePath);
  } catch (err) {
    console.error("Profile File Rename Error:", err);
    return next(new AppError("Could not rename profile document.", 500));
  }

  const fileUrl = `/uploads/documents/${newFileName}`;

  // ── Delete Old File if Provided ───────────────────────────────────────
  const { oldUrl } = req.body;
  if (oldUrl && oldUrl !== fileUrl) {
    const oldPath = path.join(publicDir, oldUrl);
    if (fs.existsSync(oldPath)) {
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
