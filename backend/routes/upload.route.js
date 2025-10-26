import express from "express";
import { protect } from "../middleware/auth.js";
import {
  deleteProfileImage,
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
// Delete profile image route
router.delete("/profile-image", protect, deleteProfileImage);

export default router;
