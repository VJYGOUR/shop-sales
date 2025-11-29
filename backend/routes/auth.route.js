import express from "express";
import {
  login,
  logout,
  refreshToken,
  signup,
  me,
  verifyEmail,
  resendVerificationEmail,
} from "../controllers/auth.controllers.js";
import { debugTokens } from "../controllers/auth.controllers.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/me", protect, me); // ← CHANGE THIS LINE
router.get("/verify-email", verifyEmail); // Email verification route
router.post("/resend-verification", resendVerificationEmail); // Resend verification

router.get("/debug-tokens", debugTokens);

export default router;
