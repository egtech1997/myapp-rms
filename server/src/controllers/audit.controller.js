import AuditLog from "../models/AuditLog.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

// ── 1. Get Global Logs (Admin Only) ───────────────────────────────────────
export const getAuditLogs = catchAsync(async (req, res) => {
  const { action, actor, entityModel, entityId, severity, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (action) filter.action = action;
  if (actor) filter.actor = actor;
  if (entityModel) filter.entityModel = entityModel;
  if (entityId) filter.entityId = entityId;
  if (severity) filter.severity = severity;

  const skip = (page - 1) * limit;

  const logs = await AuditLog.find(filter)
    .populate("actor", "username email name avatarUrl")
    .sort("-createdAt")
    .skip(skip)
    .limit(limit);

  const total = await AuditLog.countDocuments(filter);

  res.status(200).json({ 
    status: "success", 
    data: logs,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    }
  });
});

// ── 2. Get Logs for Specific Entity (e.g., Application) ───────────────────
export const getEntityLogs = catchAsync(async (req, res) => {
  const { model, id } = req.params;

  const logs = await AuditLog.find({ entityModel: model, entityId: id })
    .populate("actor", "username email name avatarUrl")
    .sort("-createdAt");

  res.status(200).json({ status: "success", data: logs });
});
