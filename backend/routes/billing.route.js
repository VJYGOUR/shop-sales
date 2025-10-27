// routes/billing.js
import express from "express";
import {
  createOrder,
  verifyPayment,
  createSubscription,
  verifySubscription,
  cancelSubscription,
  getSubscriptionDetails,
  handleWebhook,
  testRazorpayConnection,
  resumeSubscription,
  forceNewSubscription,
  syncSubscriptionStatus,
} from "../controllers/billing.controllers.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// KEEP EXISTING ROUTES
router.post("/create-order", protect, createOrder);
router.post("/verify-payment", protect, verifyPayment);

// ADD NEW SUBSCRIPTION ROUTES
router.post("/create-subscription", protect, createSubscription);
router.post("/verify-subscription", protect, verifySubscription);
router.post("/cancel-subscription", protect, cancelSubscription);
router.get("/subscription-details", protect, getSubscriptionDetails);

// Webhook doesn't need protect middleware since it's called by Razorpay
router.post("/webhook-v2", handleWebhook);
// In routes/billing.js
router.get("/test-razorpay", protect, testRazorpayConnection);
// Add these routes to your billing routes
router.post("/resume-subscription", protect, resumeSubscription);
// Add to your billing routes
router.post("/sync-subscription-status", protect, syncSubscriptionStatus);
router.post("/force-new-subscription", protect, forceNewSubscription);

export default router;
