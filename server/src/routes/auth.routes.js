import express from "express";
import passport from "passport";
import * as authController from "../controllers/auth.controller.js";
import { otpLimiter } from "../middlewares/rateLimiter.js";
import { protect } from "../middlewares/auth.middleware.js";
import { uploadAvatar } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOTP);

router.post("/login", authController.login);

router.post("/forgot-password", otpLimiter, authController.forgotPassword);
router.patch("/reset-password/:token", authController.resetPassword);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/auth/login?error=auth_failed`,
    session: false,
  }),
  authController.googleAuthCallback,
);

router.use(protect);

router.get("/me", authController.getMe);
router.post("/logout", authController.logout);

router.patch("/update-me", authController.updateMe);
router.patch("/update-password", authController.updatePassword);

router.patch(
  "/update-avatar",
  uploadAvatar.single("avatar"),
  authController.updateAvatar,
);

export default router;
