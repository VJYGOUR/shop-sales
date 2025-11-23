// controllers/billing.controllers.js
import Razorpay from "razorpay";
import User from "../models/user.models.js";

console.log(
  "Razorpay Key ID:",
  process.env.RAZORPAY_KEY_ID ? "Set" : "Not set"
);
console.log(
  "Razorpay Key Secret:",
  process.env.RAZORPAY_KEY_SECRET ? "Set" : "Not set"
);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// KEEP EXISTING ONE-TIME PAYMENT LOGIC
export const createOrder = async (req, res) => {
  try {
    console.log("Create order called for user:", req.user?._id);

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.log("Razorpay not configured");
      return res.status(500).json({
        error: "Payment system not configured. Please contact support.",
      });
    }

    const user = req.user;
    console.log("User from auth middleware:", user ? user.email : "Not found");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create Razorpay order
    const options = {
      amount: 100, // ₹29.00 in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        userId: user._id.toString(),
        plan: "paid",
        email: user.email,
      },
    };

    console.log("Creating Razorpay order with options:", options);
    const order = await razorpay.orders.create(options);
    console.log("Razorpay order created:", order.id);

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay error:", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
};

// KEEP EXISTING VERIFICATION LOGIC
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const crypto = await import("crypto");
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      const user = req.user;
      if (user) {
        user.plan = "paid";
        // Mark as one-time payment
        user.subscriptionId = null;
        user.subscriptionStatus = "one_time";
        await user.save();
        console.log(`User ${user.email} upgraded to paid plan (one-time)`);
      }

      res.json({
        success: true,
        message: "Payment verified and plan upgraded successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Payment verification failed",
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
};

// NEW: CREATE SUBSCRIPTION (RECURRING PAYMENTS)
// FIXED: Create subscription with proper user data
export const createSubscription = async (req, res) => {
  try {
    console.log("Create subscription called for user:", req.user?.email);

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        error: "Payment system not configured. Please contact support.",
      });
    }

    const user = req.user;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 🚨 CRITICAL: Verify we have the correct user data
    console.log("🔍 Creating subscription for user:", {
      email: user.email,
      name: user.name,
      userId: user._id.toString(),
    });

    let planId = process.env.RAZORPAY_PLAN_ID;

    if (!planId) {
      const plan = await razorpay.plans.create({
        period: "monthly",
        interval: 1,
        item: {
          name: "Professional Plan Monthly",
          description: "Monthly subscription for Professional Plan",
          amount: 100,
          currency: "INR",
        },
        notes: {
          plan: "paid",
        },
      });
      planId = plan.id;
      console.log("Created new plan:", planId);
    }

    // 🚨 CRITICAL: Create subscription with EXACT user email match
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 36,
      customer_notify: 1,
      notes: {
        userId: user._id.toString(),
        email: user.email, // 🎯 THIS MUST MATCH EXACTLY
        userName: user.name,
        timestamp: new Date().toISOString(),
      },
    });

    console.log("✅ Razorpay subscription created for:", user.email);

    res.json({
      id: subscription.id,
      plan_id: planId,
      amount: 100,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay subscription error:", error);
    res
      .status(500)
      .json({ error: "Failed to create subscription: " + error.message });
  }
};

// NEW: VERIFY SUBSCRIPTION
// UPDATED: VERIFY SUBSCRIPTION WITH BETTER ERROR HANDLING
// UPDATED: VERIFY SUBSCRIPTION - HANDLES 'created' STATUS
// UPDATED: VERIFY SUBSCRIPTION - USE VALID ENUM VALUES
// NEW: VERIFY SUBSCRIPTION - FIXED STATUS MAPPING
// controllers/billing.controllers.js - ENHANCED STATUS MAPPING
// FIXED: Verify subscription with proper security
// SECURITY FIX: Add this at the beginning of verifySubscription function
export const verifySubscription = async (req, res) => {
  try {
    const {
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    console.log("🔍 Verifying subscription:", {
      subscription_id: razorpay_subscription_id,
      payment_id: razorpay_payment_id,
      user_id: req.user?._id,
      user_email: req.user?.email,
    });

    if (!req.user) {
      console.error("❌ User not found in request");
      return res.status(404).json({ error: "User not found" });
    }

    // 🚨 SECURITY CHECK: Verify subscription belongs to current user
    console.log("📡 Fetching subscription from Razorpay...");
    const subscription = await razorpay.subscriptions.fetch(
      razorpay_subscription_id
    );

    console.log("📊 Subscription details:", {
      id: subscription.id,
      status: subscription.status,
      plan_id: subscription.plan_id,
      customer_email: subscription.notes?.email,
      current_user: req.user.email,
    });

    // 🚨 CRITICAL SECURITY CHECK
    if (subscription.notes?.email !== req.user.email) {
      console.error("❌ SECURITY ALERT: Subscription email mismatch!");
      return res.status(400).json({
        success: false,
        error: "Security issue detected. Please contact support.",
        security_issue: true,
      });
    }

    // 🚨 FIX: Verify payment signature
    const crypto = await import("crypto");
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_subscription_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.error("❌ Signature verification failed");
      return res.status(400).json({
        success: false,
        error: "Payment verification failed",
      });
    }

    console.log("✅ Payment signature verified");

    // 🚨 FIX: Check payment status directly
    console.log("🔍 Checking payment status...");
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    console.log("💰 Payment details:", {
      payment_id: payment.id,
      status: payment.status,
      captured: payment.captured,
      amount: payment.amount,
      subscription_id: payment.subscription_id,
    });

    const user = req.user;

    // 🚨 FIX: If payment is captured, activate subscription regardless of subscription status
    if (payment.status === "captured" && payment.captured) {
      console.log("✅ Payment captured, activating user subscription...");

      user.plan = "paid";
      user.subscriptionId = razorpay_subscription_id;
      user.subscriptionStatus = "active";
      await user.save();

      console.log(`✅ User ${user.email} upgraded to paid plan`);

      return res.json({
        success: true,
        message: "Payment verified and plan upgraded successfully!",
        subscriptionStatus: "active",
        paymentStatus: "captured",
      });
    } else {
      console.log("❌ Payment not captured yet");
      return res.status(400).json({
        success: false,
        error: "Payment not completed yet. Please wait a moment and try again.",
        paymentStatus: payment.status,
      });
    }
  } catch (error) {
    console.error("❌ Subscription verification error:", error);
    res.status(500).json({
      error: "Subscription verification failed: " + error.message,
    });
  }
};
// NEW: CANCEL SUBSCRIPTION
// FIXED: CANCEL SUBSCRIPTION - SET EXPIRY DATE
// billing.controllers.js - COMPLETE FIXED VERSION
// UPDATED cancelSubscription - Don't cancel immediately, schedule for end of period
// FIXED: CANCEL SUBSCRIPTION - WORKING VERSION
// controllers/billing.controllers.js - ENHANCED CANCEL LOGIC
// UPDATED: Enhanced cancel subscription with better status handling
// ENHANCED: Cancel subscription - schedule for end of period
// ENHANCED: Cancel subscription - schedule for end of period
// FIXED: Cancel subscription with proper status handling
export const cancelSubscription = async (req, res) => {
  try {
    const user = req.user;
    console.log(
      "🔍 CANCEL - User:",
      user.email,
      "DB Status:",
      user.subscriptionStatus
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.subscriptionId) {
      return res.status(400).json({ error: "No active subscription found" });
    }

    // First, sync with Razorpay to get real status
    const subscription = await razorpay.subscriptions.fetch(
      user.subscriptionId
    );
    console.log("🔍 CANCEL - Razorpay Status:", subscription.status);

    // 🚨 HANDLE CREATED STATUS - Subscription not activated yet
    if (subscription.status === "created") {
      console.log(
        "🔄 CANCEL - Subscription in 'created' status, cancelling immediately..."
      );

      // Cancel the stuck subscription immediately
      const cancelledSubscription = await razorpay.subscriptions.cancel(
        user.subscriptionId
      );

      // Clear user's subscription data since it was never activated
      user.subscriptionId = null;
      user.subscriptionStatus = null;
      user.subscriptionExpiresAt = null;
      // Keep plan as 'paid' if it was already set, otherwise set to 'free'
      if (user.plan === "paid" && !user.subscriptionId) {
        user.plan = "free";
      }

      await user.save();

      console.log(
        `✅ CANCEL - Stuck subscription cleaned up for: ${user.email}`
      );

      return res.json({
        success: true,
        message:
          "Pending subscription cancelled successfully. You can create a new subscription when ready.",
        subscriptionStatus: null,
        plan: user.plan,
      });
    }

    // If already cancelled in Razorpay, just update DB
    if (subscription.status === "cancelled") {
      console.log(
        "🔄 CANCEL - Subscription already cancelled in Razorpay, updating DB..."
      );

      user.subscriptionStatus = "cancelled_at_period_end";
      if (subscription.current_end) {
        user.subscriptionExpiresAt = new Date(subscription.current_end * 1000);
      } else {
        user.subscriptionExpiresAt = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        );
      }
      await user.save();

      return res.json({
        success: true,
        message:
          "Subscription was already cancelled. Database updated to reflect correct status.",
        subscriptionStatus: "cancelled_at_period_end",
        accessUntil: user.subscriptionExpiresAt.toLocaleDateString(),
      });
    }

    // Allow cancellation for active and authenticated subscriptions
    const allowedCancelStatuses = ["active", "authenticated"];
    if (!allowedCancelStatuses.includes(subscription.status)) {
      return res.status(400).json({
        error: `Cannot cancel subscription. Current status: ${subscription.status}. Please wait for the subscription to activate or contact support.`,
        currentStatus: subscription.status,
        allowedStatuses: allowedCancelStatuses,
      });
    }

    // Cancel at cycle end (not immediately)
    const cancelledSubscription = await razorpay.subscriptions.cancel(
      user.subscriptionId,
      {
        cancel_at_cycle_end: 1,
      }
    );

    console.log("🔍 CANCEL - Razorpay response:", cancelledSubscription.status);

    // Update user status to indicate scheduled cancellation
    user.subscriptionStatus = "cancelled_at_period_end";

    // Set expiry date based on current cycle end
    if (cancelledSubscription.current_end) {
      user.subscriptionExpiresAt = new Date(
        cancelledSubscription.current_end * 1000
      );
    } else {
      user.subscriptionExpiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      );
    }

    await user.save();

    console.log(
      `✅ CANCEL - Subscription scheduled for cancellation: ${user.email}`
    );

    res.json({
      success: true,
      message:
        "Subscription cancelled successfully. You'll have access until the end of your billing period.",
      subscriptionStatus: "cancelled_at_period_end",
      accessUntil: user.subscriptionExpiresAt.toLocaleDateString(),
    });
  } catch (error) {
    console.error("❌ CANCEL - Subscription cancellation error:", error);

    if (error.statusCode === 400 && error.error?.code === "BAD_REQUEST_ERROR") {
      return res.status(400).json({
        error:
          "Cannot cancel subscription at this time. Please wait 1-2 minutes and try again.",
      });
    }

    res.status(500).json({
      error: "Failed to cancel subscription: " + error.message,
    });
  }
}; // NEW: Clean up stuck subscriptions in 'created' status
export const cleanupStuckSubscription = async (req, res) => {
  try {
    const user = req.user;
    console.log(
      "🧹 CLEANUP - Checking for stuck subscription for:",
      user.email
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.subscriptionId) {
      return res.json({
        success: true,
        message: "No subscription found to clean up",
      });
    }

    // Check subscription status in Razorpay
    const subscription = await razorpay.subscriptions.fetch(
      user.subscriptionId
    );
    console.log("🔍 CLEANUP - Razorpay Status:", subscription.status);

    if (subscription.status === "created") {
      // Cancel the stuck subscription
      await razorpay.subscriptions.cancel(user.subscriptionId);

      // Clear user data
      user.subscriptionId = null;
      user.subscriptionStatus = null;
      user.subscriptionExpiresAt = null;
      if (user.plan === "paid") {
        user.plan = "free";
      }

      await user.save();

      console.log(`✅ CLEANUP - Stuck subscription removed for: ${user.email}`);

      return res.json({
        success: true,
        message:
          "Stuck subscription cleaned up successfully. You can now create a new subscription.",
        plan: user.plan,
      });
    }

    res.json({
      success: true,
      message: "No stuck subscription found",
      currentStatus: subscription.status,
    });
  } catch (error) {
    console.error("❌ CLEANUP - Error:", error);
    res.status(500).json({
      error: "Failed to clean up subscription: " + error.message,
    });
  }
};

// NEW: Create new subscription (only after expiry)
export const createNewSubscription = async (req, res) => {
  try {
    const user = req.user;
    console.log("🔄 NEW SUBSCRIPTION - User:", user.email);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 🚨 CRITICAL: Check if user still has active access from cancelled subscription
    if (
      user.subscriptionStatus === "cancelled_at_period_end" &&
      user.subscriptionExpiresAt
    ) {
      const now = new Date();
      const expiryDate = new Date(user.subscriptionExpiresAt);

      if (now < expiryDate) {
        return res.status(400).json({
          error: `You still have access until ${expiryDate.toLocaleDateString()}. Please wait until then to start a new subscription.`,
          accessUntil: expiryDate.toLocaleDateString(),
          canCreateNew: false,
        });
      }
    }

    // Create new subscription
    let planId = process.env.RAZORPAY_PLAN_ID;

    if (!planId) {
      const plan = await razorpay.plans.create({
        period: "monthly",
        interval: 1,
        item: {
          name: "Professional Plan Monthly",
          description: "Monthly subscription for Professional Plan",
          amount: 100,
          currency: "INR",
        },
      });
      planId = plan.id;
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 36,
      customer_notify: 1,
      notes: {
        userId: user._id.toString(),
        email: user.email,
        isNewAfterCancellation: "true",
      },
    });

    console.log("🔄 NEW SUBSCRIPTION - Created:", subscription.id);

    res.json({
      success: true,
      message: "New subscription created successfully",
      id: subscription.id,
      plan_id: planId,
      amount: 100,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("❌ NEW SUBSCRIPTION - Error:", error);
    res.status(500).json({
      error: "Failed to create new subscription: " + error.message,
    });
  }
};

// REMOVE the old resumeSubscription function completely
// Don't use any resume logic - only createNewSubscription

// NEW: GET SUBSCRIPTION DETAILS
export const getSubscriptionDetails = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.subscriptionId) {
      return res.status(400).json({ error: "No active subscription found" });
    }

    const subscription = await razorpay.subscriptions.fetch(
      user.subscriptionId
    );

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan_id: subscription.plan_id,
        current_start: subscription.current_start,
        current_end: subscription.current_end,
        charge_at: subscription.charge_at,
        total_count: subscription.total_count,
        paid_count: subscription.paid_count,
        notes: subscription.notes,
      },
    });
  } catch (error) {
    console.error("Get subscription details error:", error);
    res.status(500).json({ error: "Failed to get subscription details" });
  }
};

// NEW: WEBHOOK FOR RECURRING PAYMENTS
// COMPLETE WEBHOOK HANDLER - Add to your billing.controllers.js
// controllers/billing.controllers.js - ENHANCED WEBHOOK
export const handleWebhook = async (req, res) => {
  try {
    const webhookBody = req.body;
    const event = webhookBody.event;
    const payload = webhookBody.payload;

    console.log("🎯 Webhook Received:", event);

    // Verify webhook signature if secret is set
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const crypto = await import("crypto");
      const generatedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      const razorpaySignature = req.headers["x-razorpay-signature"];

      if (generatedSignature !== razorpaySignature) {
        console.error("❌ Invalid webhook signature");
        return res.status(400).json({ error: "Invalid webhook signature" });
      }
      console.log("✅ Webhook signature verified");
    }

    // 🎯 ENHANCED WEBHOOK HANDLING
    switch (event) {
      case "subscription.activated":
      case "subscription.charged":
      case "invoice.paid":
      case "payment.captured":
        await handleActiveSubscription(payload);
        break;

      case "subscription.cancelled":
        await handleCancelledSubscription(payload);
        break;

      case "payment.failed":
      case "invoice.failed":
        await handleFailedPayment(payload);
        break;

      case "subscription.pending":
      case "subscription.halted":
        await handlePendingSubscription(payload);
        break;

      default:
        console.log(`📨 Unhandled webhook event: ${event}`);
    }

    res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    res.status(200).json({
      success: false,
      error: "Webhook processing failed but acknowledged",
    });
  }
};

// 🎯 NEW: WEBHOOK HELPER FUNCTIONS
// ENHANCED WEBHOOK: Better handle resume scenarios
const handleActiveSubscription = async (payload) => {
  const subscription = payload.subscription?.entity || payload.payment?.entity;
  const subId = subscription?.id || subscription?.subscription_id;

  if (subId) {
    const user = await User.findOne({ subscriptionId: subId });
    if (user) {
      user.plan = "paid";
      user.subscriptionStatus = "active";

      // 🎯 CRITICAL: If this is a resume, preserve billing cycle logic
      if (
        subscription.notes?.isResume === "true" &&
        subscription.notes?.originalBillingCycle
      ) {
        console.log(
          `🔄 Resume detected for ${user.email}, preserving billing cycle`
        );
        // You can add custom logic here to handle billing cycle preservation
      }

      await user.save();
      console.log(`✅ ${user.email} subscription activated`);
    }
  }
};
// Add this debug function to check user data
export const debugUserSubscription = async (req, res) => {
  try {
    const user = req.user;
    const allUsers = await User.find({
      subscriptionId: { $exists: true },
    }).select("email subscriptionId subscriptionStatus");

    console.log("🔍 ALL USERS WITH SUBSCRIPTIONS:");
    allUsers.forEach((u) => {
      console.log(
        `- ${u.email}: ${u.subscriptionId} (${u.subscriptionStatus})`
      );
    });

    res.json({
      currentUser: {
        email: user.email,
        subscriptionId: user.subscriptionId,
        subscriptionStatus: user.subscriptionStatus,
      },
      allSubscriptions: allUsers,
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
};
// In handleCancelledSubscription webhook function
const handleCancelledSubscription = async (payload) => {
  const subscription = payload.subscription?.entity;
  if (subscription?.id) {
    // 🚨 CRITICAL: Make sure we're finding the correct user
    const user = await User.findOne({ subscriptionId: subscription.id });

    if (user) {
      console.log(`🔍 Webhook: Cancelling subscription for ${user.email}`);
      // Only update if not already in resumable state
      if (user.subscriptionStatus !== "cancelled_at_period_end") {
        user.subscriptionStatus = "cancelled_at_period_end";
        if (subscription.current_end) {
          user.subscriptionExpiresAt = new Date(
            subscription.current_end * 1000
          );
        }
        await user.save();
        console.log(`✅ ${user.email} subscription scheduled for cancellation`);
      }
    } else {
      console.error(
        `❌ Webhook: No user found for subscription ${subscription.id}`
      );
      // Log the notes to see what email Razorpay has
      console.log("📝 Subscription notes:", subscription.notes);
    }
  }
};

const handleFailedPayment = async (payload) => {
  const payment = payload.payment?.entity;
  if (payment?.subscription_id) {
    const user = await User.findOne({
      subscriptionId: payment.subscription_id,
    });
    if (user) {
      user.subscriptionStatus = "past_due";
      await user.save();
      console.log(`❌ ${user.email} payment failed, marked as past_due`);
    }
  }
};

const handlePendingSubscription = async (payload) => {
  const subscription = payload.subscription?.entity;
  if (subscription?.id) {
    const user = await User.findOne({ subscriptionId: subscription.id });
    if (user) {
      user.subscriptionStatus = "pending";
      await user.save();
      console.log(`⏳ ${user.email} subscription pending`);
    }
  }
};
// TEST ENDPOINT - Add to your billing.controllers.js
export const testRazorpayConnection = async (req, res) => {
  try {
    // Test Razorpay connection by fetching a dummy subscription
    const testSub = await razorpay.subscriptions.fetch("sub_test_123");
    res.json({
      success: false,
      error: "Unexpected - test subscription exists",
    });
  } catch (error) {
    if (error.statusCode === 400) {
      // This is expected - means Razorpay is connected but subscription doesn't exist
      res.json({
        success: true,
        message: "Razorpay connection working",
        keyId: process.env.RAZORPAY_KEY_ID ? "Set" : "Not set",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Razorpay connection failed",
        details: error.message,
      });
    }
  }
};
// billing.controllers.js - UPDATED RESUBSCRIBE LOGIC
// NEW: RESUME SUBSCRIPTION ENDPOINT
// In billing.controllers.js - SIMPLE VERSION
// SMART RESUME: Resume subscription from original billing cycle

// Add this to billing.controllers.js
export const cleanupStuckSubscriptions = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has a subscription stuck in created state
    if (user.subscriptionId) {
      const subscription = await razorpay.subscriptions.fetch(
        user.subscriptionId
      );

      if (subscription.status === "created") {
        // Cancel the stuck subscription
        await razorpay.subscriptions.cancel(user.subscriptionId);

        // Clear user's subscription data
        user.subscriptionId = null;
        user.subscriptionStatus = null;
        user.subscriptionExpiresAt = null;
        await user.save();

        console.log(`✅ Cleaned up stuck subscription for ${user.email}`);

        return res.json({
          success: true,
          message:
            "Stuck subscription cleaned up. You can now create a new subscription.",
        });
      }
    }

    res.json({
      success: true,
      message: "No stuck subscriptions found",
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    res.status(500).json({ error: error.message });
  }
};
// controllers/billing.controllers.js - ADMIN UTILITIES
export const fixUserSubscription = async (req, res) => {
  try {
    const user = req.user;
    console.log("🛠️ Fixing subscription for:", user.email);

    if (!user.subscriptionId) {
      return res.json({
        success: true,
        message: "No subscription to fix",
      });
    }

    // Check current subscription
    const subscription = await razorpay.subscriptions.fetch(
      user.subscriptionId
    );

    if (subscription.notes?.email !== user.email) {
      console.log("❌ Found mixed subscription:", {
        user: user.email,
        subscription: subscription.notes?.email,
      });

      // Cancel the wrong subscription
      await razorpay.subscriptions.cancel(user.subscriptionId);

      // Clear user data
      user.subscriptionId = null;
      user.subscriptionStatus = null;
      user.subscriptionExpiresAt = null;
      await user.save();

      return res.json({
        success: true,
        message:
          "Wrong subscription cancelled. You can now create a new one with correct details.",
        was_fixed: true,
      });
    }

    res.json({
      success: true,
      message: "Subscription is correct",
      was_fixed: false,
    });
  } catch (error) {
    console.error("Fix error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getUserSubscriptionStatus = async (req, res) => {
  try {
    const user = req.user;

    if (user.subscriptionId) {
      const subscription = await razorpay.subscriptions.fetch(
        user.subscriptionId
      );

      return res.json({
        success: true,
        userStatus: user.subscriptionStatus,
        razorpayStatus: subscription.status,
        needsSync: user.subscriptionStatus !== subscription.status,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          current_end: subscription.current_end,
          charge_at: subscription.charge_at,
        },
      });
    }

    res.json({
      success: true,
      message: "No subscription found",
      userStatus: user.subscriptionStatus,
    });
  } catch (error) {
    console.error("Get subscription status error:", error);
    res.status(500).json({ error: error.message });
  }
};

// NEW: Sync subscription status with Razorpay
export const syncSubscriptionStatus = async (req, res) => {
  try {
    const user = req.user;
    console.log(
      "🔄 SYNC - User:",
      user.email,
      "Current Status:",
      user.subscriptionStatus
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.subscriptionId) {
      return res.status(400).json({ error: "No subscription found" });
    }

    // Fetch current status from Razorpay
    const subscription = await razorpay.subscriptions.fetch(
      user.subscriptionId
    );
    console.log("🔍 SYNC - Razorpay status:", subscription.status);

    // Enhanced status mapping
    const statusMap = {
      created: "active",
      authenticated: "active",
      active: "active",
      cancelled: "cancelled_at_period_end", // Map to resumable state
      cancelled_at_period_end: "cancelled_at_period_end",
      pending: "pending",
      halted: "pending",
      completed: "completed",
      expired: "expired",
      past_due: "past_due",
      paused: "paused",
    };

    const mappedStatus = statusMap[subscription.status] || "pending";

    console.log(`🔄 SYNC - Mapping: ${subscription.status} → ${mappedStatus}`);

    // Update user status to match Razorpay
    user.subscriptionStatus = mappedStatus;

    // Set expiry date if cancelled
    if (
      mappedStatus === "cancelled_at_period_end" &&
      subscription.current_end
    ) {
      user.subscriptionExpiresAt = new Date(subscription.current_end * 1000);
    } else if (
      mappedStatus === "cancelled_at_period_end" &&
      !user.subscriptionExpiresAt
    ) {
      // Fallback expiry date
      user.subscriptionExpiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      );
    }

    await user.save();

    console.log(
      `✅ SYNC - User ${user.email} status updated to: ${mappedStatus}`
    );

    res.json({
      success: true,
      message: "Subscription status synced successfully",
      previousStatus: user.subscriptionStatus,
      newStatus: mappedStatus,
      razorpayStatus: subscription.status,
      accessUntil: user.subscriptionExpiresAt,
    });
  } catch (error) {
    console.error("❌ SYNC - Status sync error:", error);
    res.status(500).json({
      error: "Failed to sync subscription status: " + error.message,
    });
  }
};

// NEW: Force create new subscription (bypass current cancelled one)
export const forceNewSubscription = async (req, res) => {
  try {
    const user = req.user;
    console.log(
      "🔄 FORCE NEW - User:",
      user.email,
      "Current Status:",
      user.subscriptionStatus
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Clear old subscription data
    user.subscriptionId = null;
    user.subscriptionStatus = null;
    user.subscriptionExpiresAt = null;
    await user.save();

    console.log("✅ FORCE NEW - Cleared old subscription data");

    // Create new subscription
    let planId = process.env.RAZORPAY_PLAN_ID;

    if (!planId) {
      const plan = await razorpay.plans.create({
        period: "monthly",
        interval: 1,
        item: {
          name: "Professional Plan Monthly",
          description: "Monthly subscription for Professional Plan",
          amount: 100,
          currency: "INR",
        },
      });
      planId = plan.id;
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 36,
      customer_notify: 1,
      notes: {
        userId: user._id.toString(),
        email: user.email,
        isNew: "true",
      },
    });

    console.log("🔄 FORCE NEW - Created new subscription:", subscription.id);

    res.json({
      success: true,
      message: "New subscription ready for setup",
      id: subscription.id,
      plan_id: planId,
      amount: 100,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("❌ FORCE NEW - Error:", error);
    res.status(500).json({
      error: "Failed to create new subscription: " + error.message,
    });
  }
};
// SMART RESUME: Checks if we should resume or create new
export const smartResumeSubscription = async (req, res) => {
  try {
    const user = req.user;
    console.log(
      "🎯 SMART RESUME - User:",
      user.email,
      "Status:",
      user.subscriptionStatus
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has a valid subscription to resume
    if (!user.subscriptionId || !user.subscriptionStatus) {
      return res.status(400).json({
        error: "No subscription found to resume",
        action: "create_new",
      });
    }

    // Try to fetch the original subscription from Razorpay
    let originalSubscription;
    try {
      originalSubscription = await razorpay.subscriptions.fetch(
        user.subscriptionId
      );
      console.log(
        "🔍 Original subscription found:",
        originalSubscription.status
      );
    } catch (error) {
      console.log("❌ Original subscription not found, clearing data...");
      // Subscription doesn't exist in Razorpay, clear invalid data
      user.subscriptionId = null;
      user.subscriptionStatus = null;
      await user.save();

      return res.status(400).json({
        error: "Subscription not found. Starting new subscription...",
        action: "create_new",
        autoReset: true,
      });
    }

    // 🎯 DECISION LOGIC: When to create new vs "resume"
    const shouldCreateNew =
      originalSubscription.status === "cancelled" ||
      originalSubscription.status === "expired" ||
      originalSubscription.status === "completed";

    if (shouldCreateNew) {
      console.log("🔄 Creating new subscription (original is terminated)...");

      let planId = process.env.RAZORPAY_PLAN_ID;
      if (!planId) {
        const plan = await razorpay.plans.create({
          period: "monthly",
          interval: 1,
          item: {
            name: "Professional Plan Monthly",
            description: "Monthly subscription for Professional Plan",
            amount: 100,
            currency: "INR",
          },
        });
        planId = plan.id;
      }

      const newSubscription = await razorpay.subscriptions.create({
        plan_id: planId,
        total_count: 36,
        customer_notify: 1,
        notes: {
          userId: user._id.toString(),
          email: user.email,
          isResume: "true",
          originalSubscriptionId: user.subscriptionId,
        },
      });

      // Update user with new subscription
      user.subscriptionId = newSubscription.id;
      user.subscriptionStatus = "active";
      user.subscriptionExpiresAt = null;
      await user.save();

      console.log(`✅ New subscription created: ${newSubscription.id}`);

      return res.json({
        success: true,
        message: "New subscription created successfully!",
        subscriptionStatus: "active",
        isNewSubscription: true,
        id: newSubscription.id,
        plan_id: planId,
        amount: 100,
        currency: "INR",
        key: process.env.RAZORPAY_KEY_ID,
      });
    } else {
      // Subscription is in a state that might be resumable (like cancelled_at_period_end)
      // But Razorpay doesn't have direct resume API, so we inform the user

      return res.status(400).json({
        error: `Your subscription is in '${originalSubscription.status}' state. Razorpay doesn't allow direct resumption. Please wait for the current period to end or contact support.`,
        currentStatus: originalSubscription.status,
        action: "wait_or_contact",
      });
    }
  } catch (error) {
    console.error("❌ SMART RESUME - Error:", error);
    res.status(500).json({
      error: "Failed to process subscription resume: " + error.message,
    });
  }
};
// EMERGENCY DEBUG: Check subscription assignments
export const debugSubscriptionAssignment = async (req, res) => {
  try {
    const allUsers = await User.find({
      $or: [
        { email: "kumarvijayy036@gmail.com" },
        { email: "vishaala999111@gmail.com" },
      ],
    }).select("email subscriptionId subscriptionStatus plan");

    console.log("🔍 DEBUG - Checking user assignments:");
    allUsers.forEach((user) => {
      console.log(
        `- ${user.email}: ${user.subscriptionId} (${user.subscriptionStatus}) - Plan: ${user.plan}`
      );
    });

    // Check Razorpay for subscription details
    const subscriptionsInfo = [];
    for (const user of allUsers) {
      if (user.subscriptionId) {
        try {
          const subscription = await razorpay.subscriptions.fetch(
            user.subscriptionId
          );
          subscriptionsInfo.push({
            userEmail: user.email,
            subscriptionId: user.subscriptionId,
            razorpayStatus: subscription.status,
            razorpayNotes: subscription.notes,
          });
        } catch (error) {
          subscriptionsInfo.push({
            userEmail: user.email,
            subscriptionId: user.subscriptionId,
            error: error.message,
          });
        }
      }
    }

    res.json({
      users: allUsers,
      razorpaySubscriptions: subscriptionsInfo,
      issue: "Check if subscriptions have correct email in notes",
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
};
// EMERGENCY: Fix mixed subscriptions
// NUCLEAR: Complete subscription reset
export const nuclearResetSubscription = async (req, res) => {
  try {
    const user = req.user;
    console.log("💥 NUCLEAR RESET for:", user.email);

    if (user.subscriptionId) {
      try {
        // Cancel the subscription in Razorpay
        await razorpay.subscriptions.cancel(user.subscriptionId);
        console.log("✅ Subscription cancelled in Razorpay");
      } catch (error) {
        console.log("⚠️ Could not cancel in Razorpay:", error.message);
      }
    }

    // Completely reset user data
    user.subscriptionId = null;
    user.subscriptionStatus = null;
    user.subscriptionExpiresAt = null;
    user.plan = "free";
    await user.save();

    console.log("✅ User data completely reset");

    res.json({
      success: true,
      message: "Complete reset done. You can now create a fresh subscription.",
      reset: true,
    });
  } catch (error) {
    console.error("Nuclear reset error:", error);
    res.status(500).json({ error: error.message });
  }
};
// Auto-sync subscription status
export const syncSubscription = async (req, res) => {
  try {
    const user = req.user;
    console.log("🔄 Syncing subscription for:", user.email);

    if (!user.subscriptionId) {
      return res.json({ error: "No subscription found" });
    }

    const subscription = await razorpay.subscriptions.fetch(
      user.subscriptionId
    );

    // Check payments to determine real status
    const payments = await razorpay.subscriptions.fetchAllPayments(
      user.subscriptionId
    );
    const hasCapturedPayment = payments.items?.some(
      (p) => p.status === "captured"
    );

    let newStatus = user.subscriptionStatus;

    if (hasCapturedPayment && subscription.status === "created") {
      newStatus = "active";
      user.plan = "paid";
      console.log("✅ Auto-activated based on captured payment");
    } else if (subscription.status === "active") {
      newStatus = "active";
      user.plan = "paid";
    }

    user.subscriptionStatus = newStatus;
    await user.save();

    res.json({
      success: true,
      subscriptionStatus: newStatus,
      razorpayStatus: subscription.status,
      hasPayments: payments.items?.length > 0,
      hasCapturedPayment: hasCapturedPayment,
    });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ error: error.message });
  }
};
