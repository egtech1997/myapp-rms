import User from "../models/User.js";
import catchAsync from "../utils/catchAsync.js";

// @desc    Get all users
// @route   GET /api/v1/users
export const getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find()
    .populate("roles", "name")
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: users.length,
    data: users,
  });
});

// @desc    Activate or Deactivate a user
// @route   PATCH /api/v1/users/:id/status
export const toggleUserStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({ status: "fail", message: "User not found" });
  }

  // SAFETY LOCK: Prevent deactivating the Super Admin
  if (
    user.username === "super_admin" ||
    user.email === "superadmin@deped.gov.ph"
  ) {
    return res.status(403).json({
      status: "fail",
      message: "The protected super admin account cannot be deactivated.",
    });
  }

  user.isActive = isActive;
  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    status: "success",
    message: `User successfully ${isActive ? "activated" : "deactivated"}.`,
    data: { _id: user._id, username: user.username, isActive: user.isActive },
  });
});
