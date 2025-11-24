import mongoose from "mongoose";
import { configDotenv } from "dotenv";
import User from "../models/user.models.js";

configDotenv();

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/your-db-name";

const migratePaidToProfessional = async () => {
  try {
    // 1️⃣ Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // 2️⃣ Update users
    const result = await User.updateMany(
      { plan: "paid" },
      { plan: "professional" }
    );
    console.log(`🎉 Migration complete: ${result.modifiedCount} users updated`);
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    // 3️⃣ Close connection
    await mongoose.connection.close();
    console.log("🔌 Connection closed");
    process.exit(0);
  }
};

migratePaidToProfessional();
