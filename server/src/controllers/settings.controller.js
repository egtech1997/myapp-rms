import SystemSettings from "../models/SystemSettings.js";
import catchAsync from "../utils/catchAsync.js";

// ── GET /api/v1/settings  (public) ──────────────────────────────────────────
export const getSettings = catchAsync(async (req, res) => {
  let settings = await SystemSettings.findOne({});
  if (!settings) settings = await SystemSettings.create({});
  res.status(200).json({ status: "success", data: settings });
});

// ── PUT /api/v1/settings  (admin) ────────────────────────────────────────────
export const updateSettings = catchAsync(async (req, res) => {
  const { systemName, systemSubName, copyrightText } = req.body;

  const update = {};
  if (systemName    !== undefined) update.systemName    = systemName;
  if (systemSubName !== undefined) update.systemSubName = systemSubName;
  if (copyrightText !== undefined) update.copyrightText = copyrightText;
  if (req.file) update.logoUrl = `/uploads/system/${req.file.filename}`;

  const settings = await SystemSettings.findOneAndUpdate(
    {},
    { $set: update },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  res.status(200).json({ status: "success", data: settings });
});
