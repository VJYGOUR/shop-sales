import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import User from "../models/user.models.js";

// Debug: Check if environment variables are loaded
console.log("🔧 Cloudinary Config Check:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY
    ? "***" + process.env.CLOUDINARY_API_KEY.slice(-4)
    : "MISSING",
  api_secret: process.env.CLOUDINARY_API_SECRET
    ? "***" + process.env.CLOUDINARY_API_SECRET.slice(-4)
    : "MISSING",
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("✅ Cloudinary configured successfully");

// Memory storage (files stored in RAM temporarily)
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    console.log("📤 Uploading file to Cloudinary for user:", req.user.email);

    // Convert buffer to base64 for Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: "biztrack-profiles",
      public_id: `profile-${req.user.id}-${Date.now()}`,
      overwrite: true,
      transformation: [
        { width: 500, height: 500, crop: "fill" },
        { quality: "auto" },
        { format: "webp" },
      ],
    });

    console.log("✅ Cloudinary upload success:", uploadResult.secure_url);

    // Update user's profile image in database
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        profileImage: uploadResult.secure_url,
      },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully!",
      profileImage: uploadResult.secure_url,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        plan: user.plan,
        businessName: user.businessName,
      },
    });
  } catch (error) {
    console.error("❌ Upload error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during upload",
      error: error.message,
    });
  }
};
