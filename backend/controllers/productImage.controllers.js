import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import Product from "../models/product.models.js";

// Memory storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per image
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Upload multiple product images
export const uploadProductImages = async (req, res) => {
  try {
    const { productId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded",
      });
    }

    console.log(`📤 Uploading ${files.length} images for product:`, productId);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user owns this product (using your existing user field)
    if (product.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this product",
      });
    }

    const uploadPromises = files.map(async (file, index) => {
      // Convert buffer to base64
      const b64 = Buffer.from(file.buffer).toString("base64");
      const dataURI = "data:" + file.mimetype + ";base64," + b64;

      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: "biztrack-products",
        public_id: `product-${productId}-${Date.now()}-${index}`,
        transformation: [
          { width: 800, height: 600, crop: "limit" }, // Maintain aspect ratio
          { quality: "auto" },
          { format: "webp" },
        ],
      });

      return {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        position: product.images.length + index,
        isPrimary: product.images.length === 0 && index === 0, // First image is primary
      };
    });

    const newImages = await Promise.all(uploadPromises);

    // Add new images to product
    product.images.push(...newImages);
    await product.save();

    console.log(`✅ Added ${newImages.length} images to product`);

    res.status(200).json({
      success: true,
      message: `${newImages.length} images uploaded successfully`,
      images: newImages,
      product: await Product.findById(productId),
    });
  } catch (error) {
    console.error("❌ Product image upload error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during image upload",
      error: error.message,
    });
  }
};

// Delete product image
export const deleteProductImage = async (req, res) => {
  try {
    const { productId, imageId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user owns this product (using your existing user field)
    if (product.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this product",
      });
    }

    const imageIndex = product.images.findIndex(
      (img) => img._id.toString() === imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    const imageToDelete = product.images[imageIndex];

    // Delete from Cloudinary
    console.log("🗑️ Deleting product image:", imageToDelete.public_id);
    const deleteResult = await cloudinary.uploader.destroy(
      imageToDelete.public_id
    );
    console.log("Cloudinary deletion result:", deleteResult);

    // Remove from product images array
    product.images.splice(imageIndex, 1);

    // If we deleted the primary image, set a new primary
    if (imageToDelete.isPrimary && product.images.length > 0) {
      product.images[0].isPrimary = true;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      product: await Product.findById(productId),
    });
  } catch (error) {
    console.error("❌ Product image deletion error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during image deletion",
      error: error.message,
    });
  }
};

// Set primary image
export const setPrimaryImage = async (req, res) => {
  try {
    const { productId, imageId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user owns this product (using your existing user field)
    if (product.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this product",
      });
    }

    // Reset all images to not primary
    product.images.forEach((img) => {
      img.isPrimary = false;
    });

    // Set the selected image as primary
    const primaryImage = product.images.find(
      (img) => img._id.toString() === imageId
    );

    if (!primaryImage) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    primaryImage.isPrimary = true;
    await product.save();

    res.status(200).json({
      success: true,
      message: "Primary image updated successfully",
      product: await Product.findById(productId),
    });
  } catch (error) {
    console.error("❌ Set primary image error:", error);

    res.status(500).json({
      success: false,
      message: "Server error updating primary image",
      error: error.message,
    });
  }
};
