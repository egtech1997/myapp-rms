import rateLimit from "express-rate-limit";

// General limiter for all auth routes (Register/Login)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per window
  message: {
    message:
      "Too many attempts from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter specifically for OTP verification
export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Only 5 attempts allowed to verify OTP
  message: {
    message: "Too many incorrect OTP attempts. Please wait 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
