import User from "../models/User.js";
import Role from "../models/Role.js";
import bcrypt from "bcryptjs";
import * as otpService from "./otp.service.js";
import { generateUniqueUsername } from "../utils/username.js";

export const registerUserLogic = async (userData) => {
  const { email, password, username: providedUsername } = userData;
  const { otp, expiresAt } = otpService.generateOTP();
  const hashedOtp = otpService.hashOTP(otp);

  const targetRole = await Role.findOne({ name: "user" });
  if (!targetRole) {
    throw new Error("Role 'user' not found. Please seed the database.");
  }

  let user = await User.findOne({ email });

  if (user) {
    if (user.isVerified) {
      throw new Error("An account with this email already exists. Please log in.");
    }

    // Unverified user: resend OTP only, do not overwrite password
    user.otp = { code: hashedOtp, expiresAt };
    await user.save({ validateBeforeSave: false });
  } else {
    // Generate unique username from email if not provided
    const username = providedUsername || await generateUniqueUsername(email);

    // Only pass whitelisted fields to prevent mass assignment
    user = await User.create({
      username,
      email,
      password,
      roles: [targetRole._id],
      otp: { code: hashedOtp, expiresAt },
    });
  }

  return { user, rawOtp: otp };
};

export const verifyOTPLogic = async (email, otp) => {
  const hashedOtp = otpService.hashOTP(otp);

  const user = await User.findOne({
    email,
    "otp.code": hashedOtp,
    "otp.expiresAt": { $gt: new Date() },
  }).populate("roles");

  if (!user) throw new Error("Invalid or expired OTP");

  user.isVerified = true;
  user.otp = undefined;
  await user.save({ validateBeforeSave: false });

  return user;
};

export const loginUserLogic = async (email, password) => {
  const user = await User.findOne({ email })
    .select("+password")
    .populate("roles");

  if (!user) throw new Error("Invalid email or password");

  if (!user.password && user.googleId) {
    throw new Error(
      "This account uses Google Login. Please sign in with Google.",
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid email or password");

  if (!user.isVerified) {
    throw new Error("Please verify your account via OTP first");
  }

  return user;
};
