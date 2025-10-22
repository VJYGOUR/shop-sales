import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },
    salePrice: {
      type: Number,
      required: true,
    },
    costPrice: {
      type: Number,
      required: true,
    },
    profit: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
    // 🔑 ADD THIS USER FIELD - THIS MAKES SALES USER-SPECIFIC
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true // Every sale MUST belong to a user
    }
  },
  {
    timestamps: true,
  }
);

// Update indexes to include user
saleSchema.index({ user: 1, date: -1 }); // User's sales by date
saleSchema.index({ user: 1, productId: 1 }); // User's sales by product

export default mongoose.model("Sale", saleSchema);