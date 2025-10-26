import mongoose from "mongoose";
import Product from "../models/product.models.js";
import dotenv from "dotenv";

dotenv.config();

const generateSKU = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `SKU${timestamp}${random}`;
};

const addSkusToExistingProducts = async () => {
  try {
    console.log("🔄 Starting SKU migration...");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find all products without SKU
    const productsWithoutSKU = await Product.find({
      $or: [{ sku: { $exists: false } }, { sku: null }, { sku: "" }],
    });

    console.log(`📊 Found ${productsWithoutSKU.length} products without SKU`);

    if (productsWithoutSKU.length === 0) {
      console.log("🎉 All products already have SKUs!");
      return;
    }

    let updatedCount = 0;

    for (const product of productsWithoutSKU) {
      let sku;
      let isUnique = false;
      let attempts = 0;

      // Generate unique SKU
      while (!isUnique && attempts < 5) {
        sku = generateSKU();
        const existingProduct = await Product.findOne({ sku });
        if (!existingProduct) {
          isUnique = true;
        }
        attempts++;
      }

      // Update product with new SKU
      product.sku = sku;
      await product.save();
      updatedCount++;

      console.log(`✅ Updated: ${product.name} → ${sku}`);
    }

    console.log(`🎉 Successfully added SKUs to ${updatedCount} products`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0); // Exit the script
  }
};

// Run the migration
addSkusToExistingProducts();
