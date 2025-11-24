import razorpay from "../razorpay.js";
import crypto from "crypto";
import { configDotenv } from "dotenv";
import User from "../models/user.models.js";

configDotenv();

/**
 * CREATE SUBSCRIPTION (monthly or annual)
 */
export const createSubscription = async (req, res) => {
  const { planType, userId } = req.body; // planType: 'monthly' or 'annual'

  const planMap = {
    monthly: process.env.RAZORPAY_MONTHLY_PLAN_ID,
    annual: process.env.RAZORPAY_ANNUAL_PLAN_ID,
  };

  const planId = planMap[planType];

  if (!planId) {
    return res.status(400).json({ message: "Invalid plan type" });
  }

  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: planType === "monthly" ? 12 : 1,
    });

    // Update user: new subscription
    await User.findByIdAndUpdate(userId, {
      subscriptionId: subscription.id,
      subscriptionType: planType,
      subscriptionStatus: "pending", // until payment verified
    });

    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).json({
      message: "Error creating subscription",
      error: error.message,
    });
  }
};

/**
 * VERIFY PAYMENT SIGNATURE
 */
export const verifyPayment = async (req, res) => {
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } =
    req.body;

  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
    .digest("hex");

  if (generated_signature === razorpay_signature) {
    const user = await User.findOne({
      subscriptionId: razorpay_subscription_id,
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update subscription to active
    user.subscriptionStatus = "active";

    // Optionally, track payment info
    if (!user.payments) user.payments = [];
    user.payments.push({
      razorpay_payment_id,
      subscriptionId: razorpay_subscription_id,
      amount: null, // you can fill amount if needed
      status: "paid",
      paidAt: new Date(),
    });

    await user.save();

    return res.status(200).json({ message: "Payment verified successfully" });
  } else {
    return res.status(400).json({ message: "Invalid signature" });
  }
};

/**
 * CANCEL SUBSCRIPTION (history-aware)
 */
export const cancelSubscription = async (req, res) => {
  const { subscriptionId } = req.body;

  try {
    const cancellation = await razorpay.subscriptions.cancel(subscriptionId);

    const user = await User.findOne({ subscriptionId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Push current subscription to history
    if (!user.subscriptionHistory) user.subscriptionHistory = [];
    user.subscriptionHistory.push({
      subscriptionId: user.subscriptionId,
      subscriptionType: user.subscriptionType,
      subscriptionStatus: "cancelled",
      startedAt: user.createdAt, // or track actual start date
      endedAt: new Date(),
    });

    // Clear current subscription so user can re-subscribe
    user.subscriptionId = null;
    user.subscriptionType = null;
    user.subscriptionStatus = "cancelled";

    await user.save();

    res
      .status(200)
      .json({ message: "Subscription cancelled safely", cancellation });
  } catch (error) {
    res.status(500).json({
      message: "Failed to cancel subscription",
      error: error.message,
    });
  }
};
