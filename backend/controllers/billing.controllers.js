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
export const createSubscription = async (req, res) => {
  try {
    console.log("Create subscription called for user:", req.user?._id);

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        error: "Payment system not configured. Please contact support.",
      });
    }

    const user = req.user;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // First, check if we already have a plan, if not create one
    let planId = process.env.RAZORPAY_PLAN_ID;

    if (!planId) {
      // Create a subscription plan
      const plan = await razorpay.plans.create({
        period: "monthly",
        interval: 1,
        item: {
          name: "Professional Plan Monthly",
          description: "Monthly subscription for Professional Plan",
          amount: 100, // ₹29.00 in paise
          currency: "INR",
        },
        notes: {
          plan: "paid",
        },
      });
      planId = plan.id;
      console.log("Created new plan:", planId);
    }

    // Create subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 36, // 3 years maximum, 0 for unlimited
      customer_notify: 1,
      notes: {
        userId: user._id.toString(),
        email: user.email,
      },
    });

    console.log("Razorpay subscription created:", subscription.id);

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
export const verifySubscription = async (req, res) => {
  try {
    const { razorpay_subscription_id, razorpay_payment_id } = req.body;

    console.log("🔍 Verifying subscription:", {
      subscription_id: razorpay_subscription_id,
      payment_id: razorpay_payment_id,
      user_id: req.user?._id,
    });

    if (!req.user) {
      console.error("❌ User not found in request");
      return res.status(404).json({ error: "User not found" });
    }

    console.log("📡 Fetching subscription from Razorpay...");
    const subscription = await razorpay.subscriptions.fetch(
      razorpay_subscription_id
    );

    console.log("📊 Subscription details:", {
      id: subscription.id,
      status: subscription.status,
      plan_id: subscription.plan_id,
    });

    // 🎯 ENHANCED STATUS MAPPING - BACKWARD COMPATIBLE
    const statusMap = {
      // Active states
      created: "active",
      authenticated: "active",
      active: "active",

      // Cancellation states - FIXED MAPPING
      cancelled: "cancelled_at_period_end", // ← CRITICAL FIX
      cancelled_at_period_end: "cancelled_at_period_end", // ← NEW

      // Intermediate states
      pending: "pending",
      halted: "pending",

      // Terminal states
      completed: "completed",
      expired: "expired",

      // New states for better handling
      past_due: "past_due",
      paused: "paused",
    };

    const mappedStatus = statusMap[subscription.status] || "pending";

    console.log(`🔄 Mapping status: ${subscription.status} → ${mappedStatus}`);

    // Update user with proper status mapping
    const user = req.user;
    user.plan = "paid";
    user.subscriptionId = razorpay_subscription_id;
    user.subscriptionStatus = mappedStatus;

    // Set expiry date for cancelled subscriptions
    if (
      mappedStatus === "cancelled_at_period_end" &&
      subscription.current_end
    ) {
      user.subscriptionExpiresAt = new Date(subscription.current_end * 1000);
    }

    console.log("💾 Saving user to database...");
    await user.save();

    console.log(
      `✅ User ${user.email} subscription updated with status: ${mappedStatus}`
    );

    res.json({
      success: true,
      message: "Subscription processed successfully",
      subscriptionStatus: mappedStatus,
      razorpayStatus: subscription.status,
    });
  } catch (error) {
    console.error("❌ Subscription verification error:", error);
    res.status(500).json({
      error: "Subscription verification failed",
      details: error.message,
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

    // 🚨 CRITICAL FIX: If already cancelled in Razorpay, just update DB
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

    // Normal cancellation flow for active subscriptions
    const allowedCancelStatuses = ["active", "authenticated", "pending"];
    if (!allowedCancelStatuses.includes(subscription.status)) {
      return res.status(400).json({
        error: `Cannot cancel subscription. Current Razorpay status: ${subscription.status}.`,
        allowedStatuses: allowedCancelStatuses,
      });
    }

    // Cancel in Razorpay
    const cancelledSubscription = await razorpay.subscriptions.cancel(
      user.subscriptionId,
      { cancel_at_cycle_end: 1 }
    );

    console.log("🔍 CANCEL - Razorpay response:", cancelledSubscription.status);

    // Update user status
    user.subscriptionStatus = "cancelled_at_period_end";
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
};

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
const handleActiveSubscription = async (payload) => {
  const subscription = payload.subscription?.entity || payload.payment?.entity;
  const subId = subscription?.id || subscription?.subscription_id;

  if (subId) {
    const user = await User.findOne({ subscriptionId: subId });
    if (user) {
      user.plan = "paid";
      user.subscriptionStatus = "active";
      await user.save();
      console.log(`✅ ${user.email} subscription activated`);
    }
  }
};

const handleCancelledSubscription = async (payload) => {
  const subscription = payload.subscription?.entity;
  if (subscription?.id) {
    const user = await User.findOne({ subscriptionId: subscription.id });
    if (user) {
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
export const resumeSubscription = async (req, res) => {
  try {
    const user = req.user;
    console.log(
      "🔄 RESUME - User:",
      user.email,
      "Status:",
      user.subscriptionStatus
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // TEMPORARY FIX: Allow resume from both statuses
    const canResume =
      user.subscriptionStatus === "cancelled_at_period_end" ||
      user.subscriptionStatus === "cancelled";

    if (!canResume) {
      return res.status(400).json({ error: "No resumable subscription found" });
    }

    console.log("🔄 Creating new subscription for resume...");

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
        isResume: "true",
      },
    });

    console.log(
      "🔄 Razorpay subscription created for resume:",
      subscription.id
    );

    // Update user with new subscription
    user.subscriptionId = subscription.id;
    user.subscriptionStatus = "active";
    user.subscriptionExpiresAt = null;
    await user.save();

    console.log(`✅ User ${user.email} subscription resumed`);

    res.json({
      success: true,
      message: "Subscription resumed successfully!",
      subscriptionStatus: "active",
      id: subscription.id,
      plan_id: planId,
      amount: 100,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("❌ RESUME - Subscription resume error:", error);
    res.status(500).json({
      error: "Failed to resume subscription: " + error.message,
    });
  }
};
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
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.subscriptionStatus === "cancelled") {
      user.subscriptionStatus = "cancelled_at_period_end";

      if (!user.subscriptionExpiresAt) {
        user.subscriptionExpiresAt = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        );
      }

      await user.save();

      return res.json({
        success: true,
        message: "User subscription status fixed",
        user: {
          email: user.email,
          oldStatus: "cancelled",
          newStatus: user.subscriptionStatus,
        },
      });
    }

    res.json({
      success: true,
      message: "No fix needed",
      currentStatus: user.subscriptionStatus,
    });
  } catch (error) {
    console.error("Fix user subscription error:", error);
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
