import express from "express";
import {
  createProduct,
  getProduct,
  getProducts,
  updateProduct,
} from "../controllers/product.controllers.js";

const router = express.Router();

router.post("/create", createProduct);
router.get("/", getProducts);
router.get("/:id", getProduct);
// In server/routes/productRoutes.js - add this route
router.patch("/:id/update", updateProduct);

export default router;
