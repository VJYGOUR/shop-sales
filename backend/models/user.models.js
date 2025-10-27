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

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    plan: {
      type: String,
      enum: ["free", "paid"],
      default: "free",
    },
    subscriptionId: {
      type: String,
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: [
        "active",
        "cancelled",
        "pending",
        "expired",
        "completed",
        "one_time",
        "created",
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
        return this.name + "'s Business"; // Auto-generate from name
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
    // Add these new fields for email verification
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
  },

  { timestamps: true }
);

//PREHOOK FOR PASSWORD HAHING BEFORE STORING IN DB
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});
//add CHECKPASSWORD METHOD ON USERSCHEMA -> this will add checkpassword on each document
userSchema.methods.checkPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
