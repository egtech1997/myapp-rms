import User from "../models/User.js";
import Role from "../models/Role.js";
import bcrypt from "bcryptjs";
import * as otpService from "./otp.service.js";

export const registerUserLogic = async (userData) => {
  const { otp, expiresAt } = otpService.generateOTP();
  const hashedOtp = otpService.hashOTP(otp);

  const defaultRole = await Role.findOne({ name: "user" });

  const user = await User.create({
    ...userData,
    role: defaultRole ? defaultRole._id : null,
    otp: { code: hashedOtp, expiresAt },
  });

  return { user, rawOtp: otp };
};

export const verifyOTPLogic = async (email, otp) => {
  const hashedOtp = otpService.hashOTP(otp);

  const user = await User.findOne({
    email,
    "otp.code": hashedOtp,
    "otp.expiresAt": { $gt: Date.now() },
  }).populate("role");

  if (!user) throw new Error("Invalid or expired OTP");

  user.isVerified = true;
  user.otp = undefined;
  await user.save();
  return user;
};

export const loginUserLogic = async (email, password) => {
  // 🛡️ FIX: Added .select("+password") because your model hides it by default
  const user = await User.findOne({ email })
    .select("+password")
    .populate("role");

  if (!user) throw new Error("Invalid email or password");

  if (!user.password) {
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
