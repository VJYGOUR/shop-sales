// services/subscriptionCleanup.js
import cron from "node-cron";
import User from "../models/User.js";

export const checkExpiredSubscriptions = async () => {
  try {
    console.log("🔍 Checking for expired subscriptions...");

    const now = new Date();
    const expiredUsers = await User.find({
      subscriptionStatus: "cancelled",
      subscriptionExpiresAt: { $lt: now },
      plan: "paid",
    });

    console.log(
      `📊 Found ${expiredUsers.length} users with expired subscriptions`
    );

    for (const user of expiredUsers) {
      console.log(`⬇️ Downgrading user ${user.email} to free plan`);
      user.plan = "free";
      user.subscriptionStatus = "expired";
      await user.save();
    }

    console.log("✅ Subscription cleanup completed");
  } catch (error) {
    console.error("❌ Subscription cleanup error:", error);
  }
};

// Run every day at 3 AM
export const startSubscriptionCleanup = () => {
  cron.schedule("0 3 * * *", checkExpiredSubscriptions);
  console.log("🕒 Subscription cleanup scheduler started");
};
