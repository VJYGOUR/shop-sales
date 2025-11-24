// routes/webhook.js
import express from "express";
import crypto from "crypto";
import User from "../models/user.models.js";

const router = express.Router();

// Webhook endpoint
router.post(
  "/razorpay-webhook",
  express.json({ type: "*/*" }),
  async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const body = JSON.stringify(req.body);
    const signature = req.headers["x-razorpay-signature"];

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).send("Invalid signature");
    }

    const event = req.body.event;
    const payload = req.body.payload;

    try {
      switch (event) {
        case "subscription.activated": {
          const subscriptionId = payload.subscription.entity.id;
          const user = await User.findOne({ subscriptionId });
          if (user) {
            user.subscriptionStatus = "active";

            // Set expiration based on subscription type
            const days = user.subscriptionType === "monthly" ? 30 : 365;
            const currentDate = new Date();
            user.subscriptionExpiresAt =
              user.subscriptionExpiresAt &&
              user.subscriptionExpiresAt > currentDate
                ? new Date(
                    user.subscriptionExpiresAt.getTime() +
                      days * 24 * 60 * 60 * 1000
                  )
                : new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000);

            await user.save();
          }
          break;
        }

        case "payment.captured": {
          const payment = payload.payment.entity;
          const subscriptionId = payment.subscription_id;
          const user = await User.findOne({ subscriptionId });
          if (user) {
            if (!user.payments) user.payments = [];
            user.payments.push({
              razorpay_payment_id: payment.id,
              subscriptionId,
              amount: payment.amount / 100, // amount in INR
              status: payment.status,
              paidAt: new Date(payment.created_at * 1000),
            });
            await user.save();
          }
          break;
        }

        case "subscription.cancelled": {
          const subscriptionId = payload.subscription.entity.id;
          const user = await User.findOne({ subscriptionId });
          if (user) {
            user.subscriptionStatus = "cancelled";

            if (!user.subscriptionHistory) user.subscriptionHistory = [];
            user.subscriptionHistory.push({
              subscriptionId: user.subscriptionId,
              subscriptionType: user.subscriptionType,
              subscriptionStatus: "cancelled",
              startedAt: user.createdAt,
              endedAt: new Date(),
            });

            user.subscriptionId = null;
            user.subscriptionType = null;
            user.subscriptionExpiresAt = null;

            await user.save();
          }
          break;
        }

        case "payment.failed": {
          const payment = payload.payment.entity;
          const subscriptionId = payment.subscription_id;
          const user = await User.findOne({ subscriptionId });
          if (user) {
            user.subscriptionStatus = "past_due";
            await user.save();
          }
          break;
        }

        default:
          console.log("Unhandled Razorpay event:", event);
      }

      res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ status: "error", message: error.message });
    }
  }
);

export default router;
