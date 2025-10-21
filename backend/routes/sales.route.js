import express from "express";

import {
  createSale,
  deleteSale,
  getSales,
} from "../controllers/sales.controllers.js";

const router = express.Router();

// @desc    Get all sales
// @route   GET /api/sales
// @access  Public

router.get("/", getSales);
router.post("/create", createSale);
router.delete("/:id/delete", deleteSale);

export default router;
