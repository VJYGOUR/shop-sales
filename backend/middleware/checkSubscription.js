// middleware/checkSubscription.js
export const checkSubscriptionStatus = async (req, res, next) => {
  try {
    if (
      req.user &&
      req.user.plan === "paid" &&
      req.user.subscriptionExpiresAt
    ) {
      const now = new Date();
      if (new Date(req.user.subscriptionExpiresAt) < now) {
        // Subscription expired, downgrade user
        req.user.plan = "free";
        req.user.subscriptionStatus = "expired";
        await req.user.save();
        console.log(`🔄 Auto-downgraded ${req.user.email} to free plan`);
      }
    }
    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    next();
  }
};
