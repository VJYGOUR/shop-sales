import Razorpay from "razorpay";

console.log(
  "Razorpay Key ID:",
  process.env.RAZORPAY_KEY_ID ? "Set" : "Not set"
);
console.log(
  "Razorpay Key Secret:",
  process.env.RAZORPAY_KEY_SECRET ? "Set" : "Not set"
);

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (req, res) => {
  try {
    console.log("Create order called for user:", req.user?._id);

    // Check if Razorpay is configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.log("Razorpay not configured");
      return res.status(500).json({
        error: "Payment system not configured. Please contact support.",
      });
    }

    const user = req.user;
    console.log("User from auth middleware:", user ? user.email : "Not found");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create Razorpay order
    const options = {
      amount: 100, // ₹1.00 for testing
      currency: "INR",
      receipt: `rcpt_${Date.now()}`, // Shorter receipt ID
      notes: {
        userId: user._id.toString(),
        plan: "paid",
        email: user.email,
      },
    };

    console.log("Creating Razorpay order with options:", options);
    const order = await razorpay.orders.create(options);
    console.log("Razorpay order created:", order.id);

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay error:", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Verify payment signature
    const crypto = await import("crypto");
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      // Payment successful - update user plan
      const user = req.user;
      if (user) {
        user.plan = "paid";
        await user.save();
        console.log(`User ${user.email} upgraded to paid plan`);
      }

      res.json({
        success: true,
        message: "Payment verified and plan upgraded successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Payment verification failed",
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
};
