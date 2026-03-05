import * as authService from "../services/auth.service.js";
import sendEmail from "../services/email.service.js";
import User from "../models/User.js";
import fs from "fs";
import path from "path";

import { sendTokenCookie } from "../utils/auth.js";
import { updateLoginTimestamp, formatUserResponse } from "../utils/user.js";
import catchAsync from "../utils/catchAsync.js";

export const register = catchAsync(async (req, res, next) => {
  const { user, rawOtp } = await authService.registerUserLogic(req.body);
  await sendEmail({
    email: user.email,
    subject: "Verify Your Account",
    html: `<h2>Your OTP is: ${rawOtp}</h2><p>Valid for 10 minutes.</p>`,
  });
  res.status(201).json({ message: "OTP sent to email" });
});

export const verifyOTP = catchAsync(async (req, res, next) => {
  const user = await authService.verifyOTPLogic(req.body.email, req.body.otp);
  const populatedUser = await User.findById(user._id).populate("roles");

  await updateLoginTimestamp(populatedUser);
  sendTokenCookie(res, populatedUser);

  res.status(200).json({
    message: "Success",
    user: formatUserResponse(populatedUser),
  });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await authService.loginUserLogic(email, password);

  await updateLoginTimestamp(user);
  sendTokenCookie(res, user);

  res.status(200).json({
    message: "Login successful",
    user: formatUserResponse(user),
  });
});
export const googleAuthCallback = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return res.redirect(
      `${process.env.CLIENT_URL}/auth/login?error=auth_failed`,
    );
  }

  const user = await User.findById(req.user._id).populate("roles");

  await updateLoginTimestamp(user);
  sendTokenCookie(res, user);

  const roleNames = user.roles.map((r) => r.name);
  const isAdmin =
    roleNames.includes("admin") || roleNames.includes("super_admin");

  const redirectTarget = isAdmin ? "admin" : "user";

  res.redirect(`${process.env.CLIENT_URL}/${redirectTarget}/dashboard`);
});
export const logout = (req, res, next) => {
  res.cookie("token", "loggedout", {
    httpOnly: true,
    expires: new Date(Date.now() + 10 * 1000),
  });
  res.status(200).json({ message: "Logged out" });
};

export const getMe = catchAsync(async (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not logged in" });
  res.status(200).json({
    status: "success",
    user: formatUserResponse(req.user),
  });
});

export const updateMe = catchAsync(async (req, res, next) => {
  const { username } = req.body;
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { username },
    { new: true, runValidators: true },
  ).populate("roles");

  res.status(200).json({
    status: "success",
    user: formatUserResponse(updatedUser),
  });
});

export const updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  if (user.googleId && !user.password) {
    return res.status(400).json({
      message:
        "This account uses Google Login. Use Forgot Password to set a password.",
    });
  }

  const isMatch = await user.comparePassword(currentPassword, user.password);
  if (!isMatch)
    return res.status(401).json({ message: "Current password is incorrect" });

  user.password = newPassword;
  await user.save();

  sendTokenCookie(res, user);
  res.status(200).json({ message: "Password updated successfully" });
});

export const updateAvatar = catchAsync(async (req, res, next) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded." });

  const user = await User.findById(req.user._id).populate("roles");

  if (user.avatar && user.avatar.startsWith("/uploads/avatars/")) {
    const oldPath = path.join(process.cwd(), "public", user.avatar);
    if (fs.existsSync(oldPath)) {
      try {
        fs.unlinkSync(oldPath);
      } catch (e) {
        console.error("Old avatar delete failed:", e);
      }
    }
  }

  user.avatar = `/uploads/avatars/${req.file.filename}`;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    user: formatUserResponse(user),
  });
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ message: "User not found." });

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${process.env.CLIENT_URL}/auth/reset-password/${resetToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Request",
      html: `<h2>Reset Password</h2><p>Link: <a href="${resetURL}">${resetURL}</a></p>`,
    });
    res.status(200).json({ message: "Reset link sent!" });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return res.status(500).json({ message: "Email could not be sent." });
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const crypto = await import("crypto");
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user)
    return res.status(400).json({ message: "Token invalid or expired" });

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const populatedUser = await User.findById(user._id).populate("roles");
  await updateLoginTimestamp(populatedUser);
  sendTokenCookie(res, populatedUser);

  res.status(200).json({
    message: "Password reset successful!",
    user: formatUserResponse(populatedUser),
  });
});
