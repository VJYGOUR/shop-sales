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

    // MAP RAZORPAY STATUS TO VALID ENUM VALUES
    const statusMap = {
      created: "pending",
      authenticated: "active",
      active: "active",
      pending: "pending",
      halted: "pending",
      cancelled: "cancelled",
      completed: "completed",
      expired: "expired",
    };

    const mappedStatus = statusMap[subscription.status] || "pending";

    console.log(`🔄 Mapping status: ${subscription.status} → ${mappedStatus}`);

    // Accept all initial subscription states
    const user = req.user;
    user.plan = "paid";
    user.subscriptionId = razorpay_subscription_id;
    user.subscriptionStatus = mappedStatus; // Use mapped status

    console.log("💾 Saving user to database...");
    await user.save();

    console.log(
      `✅ User ${user.email} subscription created with status: ${mappedStatus}`
    );

    res.json({
      success: true,
      message: "Subscription created successfully",
      subscriptionStatus: mappedStatus,
      razorpayStatus: subscription.status,
      note: "Subscription will be activated once payment is completed",
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
export const cancelSubscription = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.subscriptionId) {
      return res.status(400).json({ error: "No active subscription found" });
    }

    console.log("Checking subscription status:", user.subscriptionId);

    // First, check the current subscription status
    const subscription = await razorpay.subscriptions.fetch(
      user.subscriptionId
    );

    console.log("Current subscription status:", subscription.status);

    // If already cancelled, just update our database
    if (subscription.status === "cancelled") {
      console.log("Subscription already cancelled in Razorpay");

      user.subscriptionStatus = "cancelled";
      // Set expiry date to current period end
      user.subscriptionExpiresAt = new Date(subscription.current_end * 1000);
      await user.save();

      return res.json({
        success: true,
        message: "Subscription was already cancelled. Status updated.",
        subscriptionStatus: subscription.status,
        accessUntil: new Date(
          subscription.current_end * 1000
        ).toLocaleDateString(),
      });
    }

    // If not cancelled, proceed with cancellation
    console.log("Cancelling subscription:", user.subscriptionId);
    const cancelledSubscription = await razorpay.subscriptions.cancel(
      user.subscriptionId
    );

    // Update user - set expiry date but don't downgrade immediately
    user.subscriptionStatus = "cancelled";
    user.subscriptionExpiresAt = new Date(
      cancelledSubscription.current_end * 1000
    );
    await user.save();

    console.log(`User ${user.email} subscription cancelled`);

    res.json({
      success: true,
      message:
        "Subscription cancelled successfully. You will have access until the end of your billing period.",
      subscriptionStatus: cancelledSubscription.status,
      accessUntil: new Date(
        cancelledSubscription.current_end * 1000
      ).toLocaleDateString(),
    });
  } catch (error) {
    console.error("Subscription cancellation error:", error);

    // If it's already cancelled error, handle gracefully
    if (error.statusCode === 400 && error.error?.code === "BAD_REQUEST_ERROR") {
      user.subscriptionStatus = "cancelled";
      user.subscriptionExpiresAt = new Date(); // Set to now as fallback
      await user.save();

      return res.json({
        success: true,
        message: "Subscription was already cancelled. Status updated.",
        subscriptionStatus: "cancelled",
      });
    }

    res
      .status(500)
      .json({ error: "Failed to cancel subscription: " + error.message });
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
export const handleWebhook = async (req, res) => {
  try {
    const webhookBody = req.body;
    const event = webhookBody.event;
    const payload = webhookBody.payload;

    console.log("🎯 Webhook Received:", event);
    console.log("📦 Webhook Payload:", JSON.stringify(payload, null, 2));

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
    } else {
      console.log(
        "⚠️  Webhook secret not set, skipping signature verification"
      );
    }

    // Map Razorpay status to valid database enum values
    const statusMap = {
      created: "pending",
      authenticated: "active",
      active: "active",
      pending: "pending",
      halted: "pending",
      cancelled: "cancelled",
      completed: "completed",
      expired: "expired",
      failed: "pending",
    };

    // Handle different webhook events
    switch (event) {
      case "subscription.activated":
        console.log("🎉 SUBSCRIPTION ACTIVATED");
        const activatedSub = payload.subscription?.entity;
        if (activatedSub?.id) {
          const user = await User.findOne({ subscriptionId: activatedSub.id });
          if (user) {
            user.plan = "paid";
            user.subscriptionStatus = "active";
            await user.save();
            console.log(`✅ ${user.email} subscription activated`);
          } else {
            console.log(
              `❌ User not found for subscription: ${activatedSub.id}`
            );
          }
        }
        break;

      case "subscription.charged":
        console.log("💰 RECURRING PAYMENT SUCCESS");
        const chargedSub = payload.subscription?.entity;
        if (chargedSub?.id) {
          const user = await User.findOne({ subscriptionId: chargedSub.id });
          if (user) {
            user.plan = "paid";
            user.subscriptionStatus = "active";
            await user.save();
            console.log(`✅ ${user.email} recurring payment successful`);
          } else {
            console.log(`❌ User not found for subscription: ${chargedSub.id}`);
          }
        }
        break;

      case "subscription.completed":
        console.log("🏁 SUBSCRIPTION COMPLETED");
        const completedSub = payload.subscription?.entity;
        if (completedSub?.id) {
          const user = await User.findOne({ subscriptionId: completedSub.id });
          if (user) {
            user.subscriptionStatus = "completed";
            // Don't downgrade immediately - let them use until period ends
            await user.save();
            console.log(`✅ ${user.email} subscription completed`);
          }
        }
        break;

      case "subscription.cancelled":
        console.log("❌ SUBSCRIPTION CANCELLED");
        const cancelledSub = payload.subscription?.entity;
        if (cancelledSub?.id) {
          const user = await User.findOne({ subscriptionId: cancelledSub.id });
          if (user) {
            user.subscriptionStatus = "cancelled";
            // Don't downgrade immediately - let them use until period ends
            await user.save();
            console.log(`✅ ${user.email} subscription cancelled`);
          }
        }
        break;

      case "subscription.pending":
        console.log("⏳ SUBSCRIPTION PENDING");
        const pendingSub = payload.subscription?.entity;
        if (pendingSub?.id) {
          const user = await User.findOne({ subscriptionId: pendingSub.id });
          if (user) {
            user.subscriptionStatus = "pending";
            await user.save();
            console.log(`⏳ ${user.email} subscription pending`);
          }
        }
        break;

      case "subscription.halted":
        console.log("⏸️  SUBSCRIPTION HALTED");
        const haltedSub = payload.subscription?.entity;
        if (haltedSub?.id) {
          const user = await User.findOne({ subscriptionId: haltedSub.id });
          if (user) {
            user.subscriptionStatus = "pending";
            await user.save();
            console.log(`⏸️  ${user.email} subscription halted`);
          }
        }
        break;

      case "subscription.updated":
        console.log("📝 SUBSCRIPTION UPDATED");
        const updatedSub = payload.subscription?.entity;
        if (updatedSub?.id) {
          const user = await User.findOne({ subscriptionId: updatedSub.id });
          if (user) {
            const mappedStatus = statusMap[updatedSub.status] || "pending";
            user.subscriptionStatus = mappedStatus;
            await user.save();
            console.log(
              `📝 ${user.email} subscription updated to: ${mappedStatus}`
            );
          }
        }
        break;

      case "payment.captured":
        console.log("💳 PAYMENT CAPTURED");
        const capturedPayment = payload.payment?.entity;
        if (capturedPayment?.subscription_id) {
          const user = await User.findOne({
            subscriptionId: capturedPayment.subscription_id,
          });
          if (user) {
            user.plan = "paid";
            user.subscriptionStatus = "active";
            await user.save();
            console.log(
              `✅ ${user.email} payment captured, subscription activated`
            );
          }
        }
        break;

      case "payment.failed":
        console.log("💥 PAYMENT FAILED");
        const failedPayment = payload.payment?.entity;
        if (failedPayment?.subscription_id) {
          const user = await User.findOne({
            subscriptionId: failedPayment.subscription_id,
          });
          if (user) {
            user.subscriptionStatus = "pending";
            await user.save();
            console.log(
              `❌ ${user.email} payment failed, subscription pending`
            );

            // Optional: Send email notification about failed payment
            // await sendPaymentFailedEmail(user.email);
          }
        }
        break;

      case "invoice.paid":
        console.log("🧾 INVOICE PAID");
        const paidInvoice = payload.invoice?.entity;
        if (paidInvoice?.subscription_id) {
          const user = await User.findOne({
            subscriptionId: paidInvoice.subscription_id,
          });
          if (user) {
            user.plan = "paid";
            user.subscriptionStatus = "active";
            await user.save();
            console.log(`✅ ${user.email} invoice paid, subscription active`);
          }
        }
        break;

      case "invoice.failed":
        console.log("🧾 INVOICE FAILED");
        const failedInvoice = payload.invoice?.entity;
        if (failedInvoice?.subscription_id) {
          const user = await User.findOne({
            subscriptionId: failedInvoice.subscription_id,
          });
          if (user) {
            user.subscriptionStatus = "pending";
            await user.save();
            console.log(
              `❌ ${user.email} invoice failed, subscription pending`
            );
          }
        }
        break;

      default:
        console.log(`📨 Unhandled webhook event: ${event}`);
        // Log unhandled events for monitoring
        console.log("Unhandled payload:", JSON.stringify(payload, null, 2));
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      event: event,
    });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);

    // Still return 200 to prevent Razorpay from retrying excessively
    res.status(200).json({
      success: false,
      error: "Webhook processing failed but acknowledged",
      details: error.message,
    });
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
