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
export const deleteProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.profileImage) {
      return res.status(400).json({
        success: false,
        message: "No profile image to delete",
      });
    }

    console.log("🗑️ Deleting profile image from Cloudinary");
    console.log("Image URL:", user.profileImage);

    // Extract public_id from Cloudinary URL - remove version part
    const url = user.profileImage;
    let publicId;

    if (url.includes("upload/")) {
      const parts = url.split("upload/");
      if (parts[1]) {
        // Remove version (v123456789/) and file extension
        const pathAfterUpload = parts[1];
        // Remove the version part (starts with 'v' followed by numbers)
        const withoutVersion = pathAfterUpload.replace(/^v\d+\//, "");
        // Remove file extension
        publicId = withoutVersion.replace(/\.[^/.]+$/, "");
        console.log("Extracted public_id:", publicId);
      }
    }

    if (publicId) {
      console.log("Deleting from Cloudinary with public_id:", publicId);
      const deleteResult = await cloudinary.uploader.destroy(publicId);
      console.log("✅ Cloudinary deletion result:", deleteResult);

      if (deleteResult.result === "ok") {
        console.log("🎉 Successfully deleted from Cloudinary CDN");
      } else {
        console.warn("⚠️ Cloudinary reported:", deleteResult);
        // Even if Cloudinary fails, we still update the database
      }
    } else {
      console.log("❌ Could not extract public_id from URL");
    }

    // Update user in database - set profileImage to null
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        profileImage: null,
      },
      { new: true }
    ).select("-password");

    console.log("✅ Database updated - profile image removed");

    res.status(200).json({
      success: true,
      message: "Profile image deleted successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profileImage: updatedUser.profileImage,
        plan: updatedUser.plan,
        businessName: updatedUser.businessName,
      },
    });
  } catch (error) {
    console.error("❌ Delete error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during deletion",
      error: error.message,
    });
  }
};
