import express from "express";
import { protect } from "../middleware/auth.js";
import {
  upload,
  uploadProductImages,
  deleteProductImage,
  setPrimaryImage,
} from "../controllers/productImage.controllers.js";

const router = express.Router();

// Upload multiple product images
router.post(
  "/:productId/images",
  protect,
  upload.array("productImages", 10), // Max 10 images
  uploadProductImages
);

// Delete product image
router.delete("/:productId/images/:imageId", protect, deleteProductImage);

// Set primary image
router.patch("/:productId/images/:imageId/primary", protect, setPrimaryImage);

export default router;
