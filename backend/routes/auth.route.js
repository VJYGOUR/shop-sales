import express from "express";
import {
  login,
  logout,
  refreshToken,
  signup,
  me,
} from "../controllers/auth.controllers.js";
const router = express.Router();
//signup route
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/me", me);

export default router;
