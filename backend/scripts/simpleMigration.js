// scripts/simpleMigration.js
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

const simpleMigration = async () => {
  try {
    console.log("🚀 Starting simple migration...");

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Import User model
    const User = (await import("../models/user.models.js")).default;

    // Update all users with 'cancelled' status
    const result = await User.updateMany(
      {
        subscriptionStatus: "cancelled",
        subscriptionId: { $ne: null },
      },
      {
        $set: {
          subscriptionStatus: "cancelled_at_period_end",
          subscriptionExpiresAt: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ),
        },
      }
    );

    console.log(
      `🎉 Migration completed! ${result.modifiedCount} users updated.`
    );
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Connection closed");
    process.exit(0);
  }
};

simpleMigration();
