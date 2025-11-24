import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"] },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (email) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: "Invalid email format",
      },
    },
    razorpayCustomerId: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    plan: {
      type: String,
      enum: ["free", "professional", "master"],
      default: "free",
    },

    subscriptionId: {
      type: String,
      default: null,
    },
    subscriptionType: {
      type: String,
      enum: ["monthly", "annual"],
      default: "monthly",
    },

    subscriptionStatus: {
      type: String,
      enum: [
        "active",
        "cancelled", // Keep for backward compatibility
        "cancelled_at_period_end",
        "pending",
        "expired",
        "completed",
        "one_time",
        "created",
        "past_due", // NEW: For failed payments
        "paused",
      ],
      default: null,
    },
    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },
    businessName: {
      type: String,
      default: function () {
        return this.name + "'s Business";
      },
    },
    phoneNumber: {
      type: String,
    },
    profileImage: {
      type: String,
      default: null,
    },
    cartItems: [
      {
        quantity: { type: Number, default: 1 },
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      },
    ],
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
  },
  { timestamps: true }
);

// PREHOOK FOR PASSWORD HASHING BEFORE STORING IN DB
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// ADD CHECKPASSWORD METHOD ON USERSCHEMA
userSchema.methods.checkPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
// ADD THESE HELPER METHODS AFTER checkPassword METHOD:
userSchema.methods.isPaid = function () {
  return this.subscriptionStatus === "active";
};

userSchema.methods.isExpired = function () {
  if (!this.subscriptionExpiresAt) return true;
  return new Date() > new Date(this.subscriptionExpiresAt);
};

userSchema.methods.extendSubscription = function (days) {
  const current = this.subscriptionExpiresAt
    ? new Date(this.subscriptionExpiresAt)
    : new Date();

  current.setDate(current.getDate() + days);
  this.subscriptionExpiresAt = current;
};

// ADD THESE INDEXES AT THE BOTTOM BEFORE EXPORT:
userSchema.index({ subscriptionId: 1 });
userSchema.index({ subscriptionStatus: 1 });
const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
