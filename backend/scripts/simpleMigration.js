// scripts/fixSubscriptionDates.js
import mongoose from "mongoose";
import { configDotenv } from "dotenv";
import User from "../models/user.models.js";

configDotenv();

const MONGO_URI = process.env.MONGO_URI;

const fixSubscriptions = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const users = await User.find({
      subscriptionStatus: "active",
      subscriptionType: { $in: ["monthly", "annual"] },
    });

    console.log(`Found ${users.length} active users with subscriptions`);

    const now = new Date();

    for (const user of users) {
      const days = user.subscriptionType === "monthly" ? 30 : 365;

      user.subscriptionExpiresAt = new Date(
        now.getTime() + days * 24 * 60 * 60 * 1000
      );
      console.log(user.subscriptionExpiresAt);
      await user.save();

      console.log(
        `Updated ${user.name} (${user.email}): ${user.subscriptionType} → expires at ${user.subscriptionExpiresAt}`
      );
    }

    console.log("All subscriptions updated successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

fixSubscriptions();
