import express from "express";
import { protect } from "../middleware/auth.js";
import {
  upload,
  uploadProfileImage,
} from "../controllers/upload.controllers.js";

const router = express.Router();

// Upload profile image route
router.post(
  "/profile-image",
  protect,
  upload.single("profileImage"),
  uploadProfileImage
);

export default router;
