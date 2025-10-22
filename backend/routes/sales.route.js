import express from "express";

import {
  createSale,
  deleteSale,
  getSales,
} from "../controllers/sales.controllers.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @desc    Get all sales
// @route   GET /api/sales
// @access  Public

router.get("/", protect, getSales);
router.post("/create", protect, createSale);
router.delete("/:id/delete", protect, deleteSale);

export default router;
