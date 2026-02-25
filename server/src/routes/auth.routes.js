import express from "express";
import passport from "passport";
import * as authController from "../controllers/auth.controller.js";
// import { otpLimiter } from "../middlewares/rateLimiter.js"; // Uncomment if you have this
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public Routes
router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOTP); // Add otpLimiter back if needed
router.post("/login", authController.login);

// Protected Routes
router.get("/me", protect, authController.getMe);
router.post("/logout", authController.logout);

// 🛡️ OAUTH ROUTES FIX: Removed 'session: false' so state verification works
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/auth/login?error=auth_failed`,
  }),
  authController.googleAuthCallback,
);

// Profile Routes
router.patch("/update-me", protect, authController.updateMe);
router.patch("/update-password", protect, authController.updatePassword);

export default router;
