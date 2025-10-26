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
      amount: 2900, // ₹29.00 in paise
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
          amount: 2900, // ₹29.00 in paise
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
      amount: 2900,
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
export const verifySubscription = async (req, res) => {
  try {
    const { razorpay_subscription_id, razorpay_payment_id } = req.body;

    console.log("Verifying subscription:", razorpay_subscription_id);

    // Get subscription details from Razorpay
    const subscription = await razorpay.subscriptions.fetch(
      razorpay_subscription_id
    );

    console.log("Subscription status:", subscription.status);

    if (
      subscription.status === "active" ||
      subscription.status === "authenticated"
    ) {
      const user = req.user;
      if (user) {
        user.plan = "paid";
        user.subscriptionId = razorpay_subscription_id;
        user.subscriptionStatus = subscription.status;
        await user.save();
        console.log(`User ${user.email} subscribed to paid plan (recurring)`);
      }

      res.json({
        success: true,
        message: "Subscription activated successfully",
        subscriptionStatus: subscription.status,
      });
    } else {
      res.status(400).json({
        success: false,
        error: `Subscription not active. Current status: ${subscription.status}`,
      });
    }
  } catch (error) {
    console.error("Subscription verification error:", error);
    res
      .status(500)
      .json({ error: "Subscription verification failed: " + error.message });
  }
};

// NEW: CANCEL SUBSCRIPTION
export const cancelSubscription = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.subscriptionId) {
      return res.status(400).json({ error: "No active subscription found" });
    }

    console.log("Cancelling subscription:", user.subscriptionId);

    // Cancel the subscription in Razorpay
    const subscription = await razorpay.subscriptions.cancel(
      user.subscriptionId
    );

    // Update user plan - don't downgrade immediately, let them use until period ends
    user.subscriptionStatus = "cancelled";
    await user.save();

    console.log(`User ${user.email} subscription cancelled`);

    res.json({
      success: true,
      message:
        "Subscription cancelled successfully. You will have access until the end of your billing period.",
      subscriptionStatus: subscription.status,
    });
  } catch (error) {
    console.error("Subscription cancellation error:", error);
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
export const handleWebhook = async (req, res) => {
  try {
    const webhookBody = req.body;
    const event = webhookBody.event;
    const payload = webhookBody.payload;

    console.log("Webhook received:", event);

    // Verify webhook signature (important for security)
    const crypto = await import("crypto");
    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET
      )
      .update(JSON.stringify(req.body))
      .digest("hex");

    const razorpaySignature = req.headers["x-razorpay-signature"];

    if (generatedSignature !== razorpaySignature) {
      console.error("Invalid webhook signature");
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    // Handle different subscription events
    switch (event) {
      case "subscription.charged":
        // Recurring payment successful
        const subscription = payload.subscription.entity;
        const user = await User.findOne({ subscriptionId: subscription.id });

        if (user) {
          user.plan = "paid";
          user.subscriptionStatus = subscription.status;
          await user.save();
          console.log(`Recurring payment successful for ${user.email}`);
        }
        break;

      case "subscription.cancelled":
        // Subscription cancelled
        const cancelledSub = payload.subscription.entity;
        const cancelledUser = await User.findOne({
          subscriptionId: cancelledSub.id,
        });

        if (cancelledUser) {
          cancelledUser.subscriptionStatus = "cancelled";
          await cancelledUser.save();
          console.log(`Subscription cancelled for ${cancelledUser.email}`);
        }
        break;

      case "subscription.completed":
        // Subscription completed (reached total_count)
        const completedSub = payload.subscription.entity;
        const completedUser = await User.findOne({
          subscriptionId: completedSub.id,
        });

        if (completedUser) {
          completedUser.plan = "free";
          completedUser.subscriptionStatus = "completed";
          await completedUser.save();
          console.log(`Subscription completed for ${completedUser.email}`);
        }
        break;

      case "subscription.pending":
      case "subscription.halted":
        // Handle failed payments
        const pendingSub = payload.subscription.entity;
        const pendingUser = await User.findOne({
          subscriptionId: pendingSub.id,
        });

        if (pendingUser) {
          pendingUser.subscriptionStatus = "pending";
          await pendingUser.save();
          console.log(`Payment pending for ${pendingUser.email}`);
        }
        break;

      case "payment.failed":
        // Payment failed for subscription
        const payment = payload.payment.entity;
        if (payment.subscription_id) {
          const failedUser = await User.findOne({
            subscriptionId: payment.subscription_id,
          });
          if (failedUser) {
            failedUser.subscriptionStatus = "pending";
            await failedUser.save();
            console.log(`Payment failed for ${failedUser.email}`);
          }
        }
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};
