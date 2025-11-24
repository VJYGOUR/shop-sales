import mongoose from "mongoose";

const subscriptionLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventType: {
      type: String,
      required: true, // e.g., subscription.activated, payment.failed
    },
    subscriptionId: {
      type: String,
      default: null,
    },
    paymentId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      default: null,
    },
    rawData: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

// Index for fast queries
subscriptionLogSchema.index({ user: 1, subscriptionId: 1 });

export default mongoose.model("SubscriptionLog", subscriptionLogSchema);
