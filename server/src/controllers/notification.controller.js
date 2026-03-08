import Notification from "../models/Notification.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

// ── 1. Get User Notifications ─────────────────────────────────────────────
export const getMyNotifications = catchAsync(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort("-createdAt")
    .limit(50);

  res.status(200).json({ status: "success", data: notifications });
});

// ── 2. Mark as Read ───────────────────────────────────────────────────────
export const markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);
  
  if (!notification) return next(new AppError("Notification not found", 404));
  if (notification.recipient.toString() !== req.user._id.toString()) {
    return next(new AppError("Unauthorized", 403));
  }

  notification.status = "read";
  await notification.save();

  res.status(200).json({ status: "success", data: notification });
});

// ── 3. Mark All as Read ──────────────────────────────────────────────────
export const markAllAsRead = catchAsync(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, status: "unread" },
    { status: "read" }
  );

  res.status(200).json({ status: "success", message: "All notifications marked as read" });
});
