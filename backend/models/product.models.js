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
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: true,
        },
        position: {
          type: Number,
          default: 0,
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate SKU before saving
productSchema.pre("save", async function (next) {
  if (this.isNew && !this.sku) {
    try {
      let sku;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 5;

      // Generate SKU until we get a unique one or reach max attempts
      while (!isUnique && attempts < maxAttempts) {
        // Method 1: Based on name + timestamp
        const namePrefix = this.name
          .substring(0, 3)
          .toUpperCase()
          .replace(/[^A-Z]/g, "A"); // Ensure only letters
        const timestamp = Date.now().toString().slice(-6);
        sku = `${namePrefix}${timestamp}`;

        // Method 2: Alternative - random string if above fails
        if (attempts > 0) {
          const randomStr = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();
          sku = `SKU${randomStr}`;
        }

        // Check if SKU already exists
        const existingProduct = await mongoose.models.Product.findOne({ sku });
        if (!existingProduct) {
          isUnique = true;
        }

        attempts++;
      }

      // If still not unique, use a fallback with user ID
      if (!isUnique) {
        const userIdStr = this.user.toString().slice(-4);
        sku = `SKU${Date.now().toString().slice(-6)}${userIdStr}`;
      }

      this.sku = sku;
      next();
    } catch (error) {
      // Fallback SKU generation if anything fails
      this.sku = `SKU${Date.now()}${Math.random()
        .toString(36)
        .substring(2, 6)}`;
      next();
    }
  } else {
    next();
  }
});

// Keep your existing indexes
productSchema.index({ user: 1, name: "text", category: "text" });

export default mongoose.model("Product", productSchema);
