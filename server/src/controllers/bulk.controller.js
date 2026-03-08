import BulkCommunication from "../models/BulkCommunication.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { processBulkSend } from "../services/bulk.service.js";
import { logAction } from "../services/audit.service.js";

// ── 1. Send Bulk Communication ─────────────────────────────────────────────
export const sendBulk = catchAsync(async (req, res, next) => {
  const { subject, content, type, category, recipients } = req.body;

  if (!recipients || recipients.length === 0) {
    return next(new AppError("No recipients provided", 400));
  }

  // Create record
  const bulk = await BulkCommunication.create({
    sender: req.user._id,
    subject,
    content,
    type,
    category,
    recipients: recipients.map(r => ({
      application: r.applicationId,
      user: r.userId,
      status: "pending"
    })),
    stats: {
      total: recipients.length,
      success: 0,
      failed: 0
    }
  });

  // 🛡️ Audit Log
  logAction({
    req,
    action: "BULK_COMM_SEND",
    entityModel: "User",
    entityId: req.user._id,
    description: `Sent bulk ${type} to ${recipients.length} recipients. Subject: ${subject}`,
    severity: "medium"
  });

  // Process asynchronously
  processBulkSend(bulk._id);

  res.status(202).json({
    status: "success",
    message: "Bulk communication queued for delivery",
    data: bulk
  });
});

// ── 2. Get Bulk History ──────────────────────────────────────────────────
export const getBulkHistory = catchAsync(async (req, res) => {
  const history = await BulkCommunication.find()
    .populate("sender", "username name")
    .sort("-createdAt")
    .limit(20);

  res.status(200).json({ status: "success", data: history });
});

// ── 3. Get Single Bulk Status ────────────────────────────────────────────
export const getBulkStatus = catchAsync(async (req, res, next) => {
  const bulk = await BulkCommunication.findById(req.params.id)
    .populate("recipients.user", "username email name");

  if (!bulk) return next(new AppError("Communication record not found", 404));

  res.status(200).json({ status: "success", data: bulk });
});
