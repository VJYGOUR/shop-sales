import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    costPrice: {
      type: Number,
      required: [true, "Cost price is required"],
      min: [0, "Cost price cannot be negative"],
    },
    salePrice: {
      type: Number,
      required: [true, "Sale price is required"],
      min: [0, "Sale price cannot be negative"],
    },
    category: {
      type: String,
      trim: true,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
    // 🔑 ADD THIS USER FIELD - THIS IS WHAT MAKES PRODUCTS USER-SPECIFIC
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true // Every product MUST belong to a user
    }
  },
  {
    timestamps: true,
  }
);

// Update index to include user for better performance
productSchema.index({ user: 1, name: "text", category: "text" });
productSchema.index({ user: 1, sku: 1 }, { unique: true, sparse: true });

export default mongoose.model("Product", productSchema);