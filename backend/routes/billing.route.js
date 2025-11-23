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
  createNewSubscription,
  cleanupStuckSubscription,
  debugUserSubscription,
  debugSubscriptionAssignment,
  fixUserSubscription,
  nuclearResetSubscription,
  syncSubscription, // ADD THIS
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

// ADD NEW ROUTE FOR CREATING SUBSCRIPTION AFTER EXPIRY
router.post("/create-new-subscription", protect, createNewSubscription); // ADD THIS LINE

// Webhook doesn't need protect middleware since it's called by Razorpay
router.post("/webhook-v2", handleWebhook); // Add cleanup route
router.post("/cleanup-stuck-subscription", protect, cleanupStuckSubscription);

// Test route
router.get("/test-razorpay", protect, testRazorpayConnection);
router.get("/debug-subscriptions", protect, debugUserSubscription);
router.get(
  "/debug-subscription-assignment",
  protect,
  debugSubscriptionAssignment
);
router.post("/fix-subscription", protect, fixUserSubscription);
router.post("/nuclear-reset", protect, nuclearResetSubscription);
router.get("/sync-subscription", protect, syncSubscription);

export default router;
