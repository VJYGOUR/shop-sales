import { useState } from "react";
import { useAuth } from "../utils/AuthContext";
import axios from "../axios/axiosInstance";
import { useNavigate } from "react-router-dom";

interface PriceData {
  tier: string;
  monthly: number;
  yearly: number;
  features: string[]; // replaces serviceOne, serviceTwo, serviceThree
  maxUsers: number;
  maxProducts: number;
  reports: boolean;
  analytics: boolean;
  inventoryAlerts: boolean;
  advancedIntegrations: boolean;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpayPaymentResponse) => void;
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

const priceData: PriceData[] = [
  {
    tier: "Basic",
    monthly: 19,
    yearly: 199,
    features: [
      "Single Store Management",
      "Basic Inventory Tracking",
      "Daily Sales Recording",
      "Low Stock Alerts",
    ],
    maxUsers: 1,
    maxProducts: 500,
    reports: true,
    analytics: false,
    inventoryAlerts: true,
    advancedIntegrations: false,
  },
  {
    tier: "Professional",
    monthly: 270,
    yearly: 2099,
    features: [
      "Multi-Store Support",
      "Advanced Inventory Tracking",
      "Staff Accounts (Up to 5)",
      "Purchase Order Management",
      "Expense Tracking",
      "Profit & Loss Reports",
      "Email Alerts",
    ],
    maxUsers: 5,
    maxProducts: 5000,
    reports: true,
    analytics: true,
    inventoryAlerts: true,
    advancedIntegrations: false,
  },
  {
    tier: "Master",
    monthly: 500,
    yearly: 3500,
    features: [
      "Unlimited Stores",
      "Real-Time Sync Across Devices",
      "Unlimited Staff Accounts",
      "Barcode / QR Code Scanning",
      "Supplier Management",
      "Advanced Financial Reports",
      "Business Intelligence Dashboard",
      "API & 3rd-Party Integrations",
    ],
    maxUsers: 9999,
    maxProducts: 999999,
    reports: true,
    analytics: true,
    inventoryAlerts: true,
    advancedIntegrations: true,
  },
];

const BillingPage = () => {
  const INR_TO_USD = 90; // 1 USD = 90 INR

  const [isMonthly, setIsMonthly] = useState(false);
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Subscribe to a plan
  const handleSubscribe = async (tier: string) => {
    if (!user) return alert("Please login first");

    setLoading(true);
    try {
      const planType: "monthly" | "annual" = isMonthly ? "monthly" : "annual";

      const response = await axios.post("/billing/create-subscription", {
        planType,
        userId: user.id,
        tier,
      });

      const subscription: { id: string } = response.data;

      const options: RazorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID as string,
        subscription_id: subscription.id,
        name: "Stoq",
        description: `${tier} Plan Subscription`,
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#06b6d4", // Cyan color
        },
        handler: async (response: RazorpayPaymentResponse) => {
          await axios.post("/billing/verify", response);
          alert("Subscription successful!");
          await refreshUser();
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert("Failed to create subscription: " + error.message);
      } else {
        alert("Failed to create subscription");
      }
    } finally {
      setLoading(false);
    }
  };

  // Cancel the current subscription
  const handleCancelSubscription = async () => {
    if (!user || !user.subscriptionId) return alert("No active subscription");

    setLoading(true);
    try {
      await axios.post("/billing/cancel-subscription", {
        subscriptionId: user.subscriptionId,
      });
      alert("Subscription cancelled successfully!");
      await refreshUser();
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert("Failed to cancel subscription: " + error.message);
      } else {
        alert("Failed to cancel subscription");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">
            Choose Your Plan
          </h1>
          <p className="text-gray-300 text-lg">
            Scale your business with our flexible pricing plans
          </p>
          {user && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-white/5 rounded-xl border border-white/10">
              <span className="text-cyan-400 font-medium mr-2">Welcome,</span>
              <span className="text-white">{user.name}</span>
            </div>
          )}
        </div>

        {/* Toggle Monthly / Annually */}
        <div className="flex items-center justify-center gap-6 mb-12">
          <span
            className={`text-lg font-semibold ${
              !isMonthly ? "text-cyan-400" : "text-gray-400"
            }`}
          >
            Annually
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isMonthly}
              onChange={() => setIsMonthly(!isMonthly)}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-600 rounded-full peer-checked:bg-cyan-600 transition-all duration-300"></div>
            <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-7"></div>
          </label>
          <span
            className={`text-lg font-semibold ${
              isMonthly ? "text-cyan-400" : "text-gray-400"
            }`}
          >
            Monthly
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {priceData.map((curr, i) => {
            const isMiddle = i === 1; // Only middle card is active
            const price = isMonthly ? curr.monthly : curr.yearly;
            const usdPrice = (price / INR_TO_USD).toFixed(2);

            return (
              <div
                key={i}
                className={`
                  relative backdrop-blur-xl rounded-2xl p-8 border transition-all duration-500
                  ${
                    isMiddle
                      ? "bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border-cyan-500/30 shadow-2xl shadow-cyan-500/20 scale-105 hover:scale-110"
                      : "bg-white/5 border-white/10 hover:border-cyan-500/20 hover:bg-white/10"
                  }
                `}
              >
                {/* Popular Badge for Middle Card - FIXED ALIGNMENT */}
                {isMiddle && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-full max-w-[90%]">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg text-center whitespace-nowrap mx-auto">
                      MOST POPULAR
                    </div>
                  </div>
                )}

                {/* Tier Name */}
                <div
                  className={`text-center mb-6 ${
                    isMiddle ? "text-white" : "text-gray-300"
                  }`}
                >
                  <h3 className="text-2xl font-bold mb-2">{curr.tier}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-cyan-400">
                      ${usdPrice}
                    </span>
                    <span className="text-gray-400">
                      /{isMonthly ? "month" : "year"}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-4 mb-8">
                  {curr.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          isMiddle ? "bg-cyan-500" : "bg-gray-600"
                        }`}
                      >
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span
                        className={isMiddle ? "text-white" : "text-gray-300"}
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subscribe Button */}
                {
                  <button
                    disabled={!isMiddle || loading}
                    onClick={() =>
                      user ? handleSubscribe(curr.tier) : navigate("/login")
                    }
                    className={`
                    w-full py-4 rounded-xl font-bold transition-all duration-300
                    ${
                      isMiddle
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-2xl hover:shadow-cyan-500/25 hover:scale-105"
                        : "bg-white/10 text-gray-400 border border-white/10 cursor-not-allowed"
                    }
                    ${loading ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                  >
                    {loading && isMiddle
                      ? "🔄 Processing..."
                      : isMiddle
                      ? "🚀 Get Started"
                      : "Coming Soon"}
                  </button>
                }

                {/* Cancel Subscription Button */}
                {isMiddle && user?.subscriptionStatus === "active" && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={loading}
                    className="w-full mt-4 py-3 bg-red-600/20 text-red-300 border border-red-500/30 rounded-xl font-bold hover:bg-red-600/30 hover:border-red-400/50 transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? "🔄 Processing..." : "Cancel Subscription"}
                  </button>
                )}

                {/* Current Plan Indicator */}
                {isMiddle && user?.plan === "professional" && (
                  <div className="mt-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm border border-green-500/30">
                      ✅ Current Plan
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12 text-gray-400">
          <p>
            All plans include 24/7 support and a 30-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
