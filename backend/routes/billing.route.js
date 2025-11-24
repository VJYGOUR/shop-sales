import express from "express";
import {
  createSubscription,
  verifyPayment,
  cancelSubscription,
} from "../controllers/billing.controllers.js";

const router = express.Router();

router.post("/create-subscription", createSubscription);
router.post("/verify", verifyPayment);
router.post("/cancel-subscription", cancelSubscription);

export default router;
