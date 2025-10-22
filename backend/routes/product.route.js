import express from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
} from "../controllers/product.controllers.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/create", protect, createProduct);
router.get("/", protect, getProducts);
router.get("/:id", protect, getProduct);
// In server/routes/productRoutes.js - add this route
router.patch("/:id/update", protect, updateProduct);
router.delete("/:id/delete", protect, deleteProduct);

export default router;
