import Resource from "../models/Resource.js";
import catchAsync from "../utils/catchAsync.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Public: list published resources ──────────────────────────────────────────
export const getPublishedResources = catchAsync(async (req, res) => {
  const { search, category } = req.query;

  const filter = { isPublished: true };
  if (category && category !== "all") filter.category = category;
  if (search) filter.$text = { $search: search };

  const resources = await Resource.find(filter)
    .populate("uploadedBy", "username")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ status: "success", data: resources });
});

// ── Admin: list all resources ──────────────────────────────────────────────────
export const getAllResources = catchAsync(async (req, res) => {
  const { search, category } = req.query;

  const filter = {};
  if (category && category !== "all") filter.category = category;
  if (search) filter.$text = { $search: search };

  const resources = await Resource.find(filter)
    .populate("uploadedBy", "username")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ status: "success", data: resources });
});

// ── Admin: create resource ─────────────────────────────────────────────────────
export const createResource = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "A file is required." });
  }

  const { title, description, category, isPublished } = req.body;

  const resource = await Resource.create({
    title,
    description: description || "",
    category:    category    || "other",
    isPublished: isPublished === "false" ? false : true,
    filePath:    `/uploads/resources/${req.file.filename}`,
    originalName: req.file.originalname,
    fileSize:    req.file.size,
    mimeType:    req.file.mimetype,
    uploadedBy:  req.user._id,
  });

  const populated = await Resource.findById(resource._id)
    .populate("uploadedBy", "username")
    .lean();

  res.status(201).json({ status: "success", data: populated });
});

// ── Admin: update resource metadata ───────────────────────────────────────────
export const updateResource = catchAsync(async (req, res) => {
  const { title, description, category, isPublished } = req.body;

  const update = {};
  if (title       !== undefined) update.title       = title;
  if (description !== undefined) update.description = description;
  if (category    !== undefined) update.category    = category;
  if (isPublished !== undefined) update.isPublished = isPublished === "false" ? false : Boolean(isPublished);

  // If a new file was uploaded, replace the old one
  if (req.file) {
    const resource = await Resource.findById(req.params.id).lean();
    if (resource?.filePath?.startsWith("/uploads/resources/")) {
      const oldPath = path.join(__dirname, "..", "..", "public", resource.filePath);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { console.error("Old resource file delete failed:", e); }
      }
    }
    update.filePath     = `/uploads/resources/${req.file.filename}`;
    update.originalName = req.file.originalname;
    update.fileSize     = req.file.size;
    update.mimeType     = req.file.mimetype;
  }

  const updated = await Resource.findByIdAndUpdate(
    req.params.id,
    { $set: update },
    { new: true, runValidators: true }
  ).populate("uploadedBy", "username").lean();

  if (!updated) return res.status(404).json({ message: "Resource not found." });

  res.status(200).json({ status: "success", data: updated });
});

// ── Admin: toggle publish ──────────────────────────────────────────────────────
export const togglePublish = catchAsync(async (req, res) => {
  const resource = await Resource.findById(req.params.id).lean();
  if (!resource) return res.status(404).json({ message: "Resource not found." });

  const updated = await Resource.findByIdAndUpdate(
    req.params.id,
    { $set: { isPublished: !resource.isPublished } },
    { new: true }
  ).populate("uploadedBy", "username").lean();

  res.status(200).json({ status: "success", data: updated });
});

// ── Admin: delete resource ─────────────────────────────────────────────────────
export const deleteResource = catchAsync(async (req, res) => {
  const resource = await Resource.findById(req.params.id).lean();
  if (!resource) return res.status(404).json({ message: "Resource not found." });

  if (resource.filePath?.startsWith("/uploads/resources/")) {
    const filePath = path.join(__dirname, "..", "..", "public", resource.filePath);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.error("Resource file delete failed:", e); }
    }
  }

  await Resource.findByIdAndDelete(req.params.id);
  res.status(200).json({ status: "success", message: "Resource deleted." });
});
