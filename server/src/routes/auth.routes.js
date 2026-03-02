import express from "express";
import passport from "passport";
import * as authController from "../controllers/auth.controller.js";
import { otpLimiter } from "../middlewares/rateLimiter.js";
import { protect } from "../middlewares/auth.middleware.js";
import { uploadAvatar } from "../middlewares/upload.middleware.js";

const router = express.Router();

/**
 * PUBLIC AUTH ROUTES
 */

// Register and OTP verification
router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOTP);

// Standard Login
router.post("/login", authController.login);

// Password Recovery
// Added otpLimiter here to prevent spamming the reset email service
router.post("/forgot-password", otpLimiter, authController.forgotPassword);
router.patch("/reset-password/:token", authController.resetPassword);

/**
 * GOOGLE OAUTH ROUTES
 */

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account", // Forces the account selector
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/auth/login?error=auth_failed`,
    session: false, // We use JWT/Cookies, so session is not required
  }),
  authController.googleAuthCallback,
);

/**
 * PROTECTED ROUTES (Requires Login)
 */

// Apply protect middleware to everything below this line
router.use(protect);

router.get("/me", authController.getMe);
router.post("/logout", authController.logout);

// Profile Updates
router.patch("/update-me", authController.updateMe);
router.patch("/update-password", authController.updatePassword);

// Avatar Upload
router.patch(
  "/update-avatar",
  uploadAvatar.single("avatar"),
  authController.updateAvatar,
);

export default router;
